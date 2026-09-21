import { isUndefined, groupBy } from 'lodash-es'
import { InvalidArgument } from '../../util/error.mjs'

// import { grave } from './reports/grave.mjs'
// import { grave_path } from './reports/grave-path.mjs'
// import { grave_path_phase } from './reports/grave-path-phase.mjs'
import { stratigraphy } from './reports/stratigraphy.mjs'
import { sequences } from './reports/sequences.mjs'
import { table } from './reports/table.mjs'

const graphRequests = new WeakMap()

const sharePending = (pending, key, create) => {
  let result = pending.get(key)
  if (!result) {
    result = Promise.resolve().then(create).finally(() => {
      if (pending.get(key) === result) pending.delete(key)
    })
    pending.set(key, result)
  }
  return result
}

const withSignal = (result, signal) => {
  if (!signal) return result
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener('abort', onAbort)
      reject(signal.reason)
    }
    signal.addEventListener('abort', onAbort, { once: true })
    result.then(value => {
      signal.removeEventListener('abort', onAbort)
      resolve(value)
    }, error => {
      signal.removeEventListener('abort', onAbort)
      reject(error)
    })
    if (signal.aborted) onAbort()
  })
}

const indexVisualize = (ctx, cubes) => {
  // prettier-ignore
  const reports = [
    stratigraphy(ctx, cubes),
    sequences(ctx, cubes),
    table(cubes)
  ]

  // prettier-ignore
  const {
    logger,
    sqlite,
    graphviz
  } = ctx

  let shared = graphRequests.get(graphviz)
  if (!shared) {
    shared = { queries: new Map(), prepared: new Map() }
    graphRequests.set(graphviz, shared)
  }

  const renderStructured = async (report, data, params) => {
    if (params.format === 'json') {
      if (!report.json) {
        throw new Error(`Report does not support JSON: ${report.name}`)
      }
      return report.json(data, params)
    }

    if (params.format === 'csv') {
      if (!report.csv) {
        throw new Error(`Report does not support CSV: ${report.name}`)
      }
      return report.csv(data, params)
    }

    if (params.format === 'stats') {
      return null
    }

    throw new Error(`Report does not support Graphviz output: ${report.name}`)
  }

  const getC14Measurements = async () => {
    const measurements = await sqlite.all(
      `
        select
          lower(entity) as entity,
          entity_id,
          chrono_from,
          chrono_to,
          chrono_source_ref
        from pd_chrono_constraint
        where chrono_source = ?
          and entity_property = 'key'
        order by entity, entity_id, chrono_from, chrono_to, chrono_source_ref
      `,
      ['C-14']
    )

    return groupBy(measurements, measurement => `${measurement.entity}|${measurement.entity_id}`)
  }

  const runOne = async (reportName, params, signal) => {
    const report = reports.find(candidate => candidate.name === reportName)
    if (!report) {
      return logger.warn('app.visualize:skipping', {
        params: { reason: 'no suitable report found' }
      })
    }

    logger.debug('app.visualize:started', { params: { report: reportName } })

    // graph queries use the cube and filters, not display settings or output format
    const queryKey = report.dot
      ? JSON.stringify([reportName, params.cube, params.filters])
      : null
    const getData = () => report.dot
      ? sharePending(shared.queries, queryKey, () => report.run(params))
      : report.run(params)

    let content
    let stats
    if (report.dot && !['json', 'csv', 'stats'].includes(params.format)) {
      const displayParams = { ...params }
      delete displayParams.format
      const renderKey = JSON.stringify([reportName, displayParams])
      const prepared = await withSignal(sharePending(shared.prepared, renderKey, async () => {
        const data = await getData()
        const c14Measurements = await getC14Measurements()
        logger.debug('app.visualize.query:done', { params: { report: reportName } })
        return {
          source: await report.dot({ ...data, c14Measurements }, params),
          stats: data.stats || {}
        }
      }), signal)

      content = params.format === 'dot'
        ? prepared.source
        : await graphviz.render(prepared.source, params.format, { signal })
      stats = prepared.stats
    } else {
      const data = await withSignal(getData(), signal)
      logger.debug('app.visualize.query:done', { params: { report: reportName } })
      content = await renderStructured(report, data, params)
      stats = data.stats || {}
    }

    logger.debug('app.visualize.render:done', { params: { report: reportName } })
    return { content, stats }
  }

  const normalizeFilters = filters => {
    if (isUndefined(filters)) {
      return { logic: 'and', filters: [] }
    }
    if (!Array.isArray(filters)) {
      if (!filters || typeof filters !== 'object') {
        throw new InvalidArgument('Visualization filters must be a group or an array')
      }
      return filters
    }

    const toKey = filter => `${filter.attribute}|${filter.operator}`
    const mergeValues = group => {
      return group.reduce((merged, filter) => {
        if (!merged.attribute) {
          merged.attribute = filter.attribute
          merged.operator = filter.operator
          merged.value = []
        }
        const values = Array.isArray(filter.value) ? filter.value : [filter.value]
        merged.value.push(...values)
        return merged
      }, {})
    }
    const merged = Object.values(groupBy(filters, toKey)).map(mergeValues)
    return { logic: 'and', filters: merged }
  }

  const toFilter = filter => {
    const report = filter.name || ''
    const params = filter.params || {}

    params.filters = normalizeFilters(params.filters)
    cubes.selected(params)

    return {
      report,
      params
    }
  }

  return async (filter = {}, { signal } = {}) => {
    signal?.throwIfAborted()
    let report
    let params

    const request = toFilter(filter)
    report = request.report
    params = request.params

    return await runOne(report, params, signal)
  }
}

export { indexVisualize }
