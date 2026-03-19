import {
  getColumns,
  getColumnNames,
  getValuePlaceholders
} from '../../util/table.mjs'

import { sources } from './sources/_index.mjs'

const exportGraph = ({ logger, sqlite, neo4j }) => {
  const drop = async t => {
    await sqlite.exec(`
      drop table if exists ${t.name}
    `)
  }

  const create = async t => {
    await sqlite.exec(`
      create table if not exists ${t.name} (
        ${getColumns(t)}
      )
    `)
  }

  const insert = async (t, data) => {
    if (!data || data.length === 0) return

    const sql = `
      insert into ${t.name} (
        ${getColumnNames(t)}
      ) values (
        ${getValuePlaceholders(t)}
      )
    `

    await sqlite.exec('BEGIN')
    const stmt = await sqlite.prepare(sql)
    try {
      for (const record of data) {
        await stmt.run(Object.values(record))
      }
      await sqlite.exec('COMMIT')
    } catch (e) {
      await sqlite.exec('ROLLBACK')
      throw e
    } finally {
      await stmt.finalize()
    }
  }

  const extract = async source => {
    return await neo4j.exec(source.query())
  }

  const transform = (source, data) => {
    return data.map(source.transform)
  }

  const load = async (source, data) => {
    await drop(source)
    await create(source)
    await insert(source, data)
  }

  const exportOne = async source => {
    let data = []
    data = await extract(source)
    data = transform(source, data)
    await load(source, data)

    logger.info('app.export.exportGraph.exportOne:done', {
      params: {
        name: source.name
      }
    })
  }

  return async () => {
    logger.info('app.merge.exportGraph:started')
    for (const source of sources) {
      await exportOne(source)
    }
    logger.info('app.export.exportGraph:done')
    return {
      exported: true
    }
  }
}

export { exportGraph }
