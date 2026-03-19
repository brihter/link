import { rawInput } from './raw/_index.mjs'
import {
  getColumns,
  getColumnNames,
  getValuePlaceholders
} from '../../util/table.mjs'

const loadRaw = ctx => {
  let inputs = []
  inputs = rawInput(ctx)

  const load = async (input, data) => {
    const sqlite = ctx.sqlite

    const drop = async () => {
      await sqlite.exec(`drop table if exists etl_${input.name}`)
    }

    const create = async () => {
      await sqlite.exec(`create table if not exists etl_${input.name} (
        ${getColumns(input)}
      )`)
    }
    const sql = `
      insert into etl_${input.name} (
        ${getColumnNames(input)}
      ) values (
        ${getValuePlaceholders(input)}
      )
    `
    await drop()
    await create()
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

  const loadOne = async input => {
    ctx.logger.info('app.loadRaw.loadOne.load:started', {
      params: { name: input.name }
    })

    let data
    data = await input.extract()
    ctx.logger.info('app.loadRaw.loadOne.extract:done', {
      params: { name: input.name }
    })

    data = data.map(input.transform).flat()
    ctx.logger.info('app.loadRaw.loadOne.transform:done', {
      params: { name: input.name }
    })

    await load(input, data)
    ctx.logger.info('app.loadRaw.loadOne.load:done', {
      params: { name: input.name }
    })
  }

  return async () => {
    ctx.logger.info('app.loadRaw:started')
    for (const input of inputs) {
      await loadOne(input)
    }
    ctx.logger.info('app.loadRaw:done')
  }
}

export { loadRaw }
