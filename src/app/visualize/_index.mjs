import { exec } from 'node:child_process'
import { v4 as uuid } from 'uuid'
import { isUndefined, groupBy } from 'lodash-es'

// import { grave } from './reports/grave.mjs'
// import { grave_path } from './reports/grave-path.mjs'
// import { grave_path_phase } from './reports/grave-path-phase.mjs'
import { node } from './reports/node.mjs'
import { node_paths } from './reports/node-paths.mjs'

const indexVisualize = ctx => {
  // prettier-ignore
  const reports = [
    node(ctx),
    node_paths(ctx)
  ]

  // prettier-ignore
  const {
    logger,
    storage
  } = ctx

  const run = cmd => {
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) return reject(error)
        if (stderr) return reject(stderr)
        resolve(stdout)
      })
    })
  }

  const render = async (report, data, params) => {
    const fileAsDot = await report.dot(data, params)

    if (params.format === 'dot') {
      return fileAsDot
    }

    const file = `${uuid()}`
    await storage.write(`dot/${file}.dot`, fileAsDot)
    await run(
      `dot -T${params.format} data/dot/${file}.dot > data/dot/${file}.svg`
    )
    return `data/dot/${file}.svg`
  }

  const runOne = async (reportName, params) => {
    let report
    report = reports.filter(r => r.name === reportName)

    // no do
    if (report.length === 0) {
      return logger.warn('app.visualize:skipping', {
        params: {
          reason: 'no suitable report found'
        }
      })
    }

    report = report.pop()
    logger.debug('app.visualize:started', { params: { report: reportName } })

    const data = await report.run(params)
    logger.debug('app.visualize.query:done', { params: { report: reportName } })

    const content = await render(report, data, params)
    logger.debug('app.visualize.render:done', {
      params: { report: reportName }
    })

    return {
      content,
      stats: data.stats || {}
    }
  }

  const merge = filter => {
    const toKey = f => `${f.entity}|${f.attribute}|${f.operator}`
    const toFilter = (acc, curr) => {
      acc.entity = acc.entity ? acc.entity : curr.entity
      acc.attribute = acc.attribute ? acc.attribute : curr.attribute
      acc.operator = acc.operator ? acc.operator : curr.operator
      if (!acc.value) acc.value = []
      acc.value.push(curr.value)
      return acc
    }

    let filters = []
    filters = groupBy(filter.filters, toKey)
    filters = Object.values(filters)
    filters = filters.map(f => f.reduce(toFilter, {}))

    filter.filters = filters
    return filter
  }

  const toFilter = filter => {
    const report = filter.name || ''
    const params = merge(filter.params)

    return {
      report,
      params
    }
  }

  return async (filter = {}) => {
    let report
    let params

    const xxx2 = toFilter(filter)
    report = xxx2.report
    params = xxx2.params

    return await runOne(report, params)
  }
}

export { indexVisualize }
