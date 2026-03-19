import { getColumns, getColumnNames } from '../../util/table.mjs'

import { pd_key_grave } from './tables/pd_key_grave.mjs'
import { pd_grave } from './tables/pd_grave.mjs'
import { pd_item } from './tables/pd_item.mjs'
import { pd_item_positions } from './tables/pd_item_position.mjs'
import { pd_phase } from './tables/pd_phase.mjs'
import { pd_chrono_constraint } from './tables/pd_chrono_constraint.mjs'

const mergeRaw = ctx => {
  const tables = [
    pd_key_grave(ctx),
    pd_phase(ctx),
    pd_grave(ctx),
    pd_item_positions(ctx),
    pd_item(ctx),
    pd_chrono_constraint(ctx),
  ]

  const drop = async t => {
    await ctx.sqlite.exec(`
      drop table if exists ${t.name}
    `)
  }

  const create = async t => {
    await ctx.sqlite.exec(`
      create table if not exists ${t.name} (
        ${getColumns(t)}
      )
    `)
  }

  const load = async t => {
    await ctx.sqlite.exec(`
      insert into ${t.name} (${getColumnNames(t)})
      ${t.source()}
    `)
  }

  const mergeOne = async t => {
    await drop(t)
    await create(t)
    await load(t)
    ctx.logger.info('app.merge.mergeOne:done', { params: { name: t.name } })
    return t.name
  }

  return async () => {
    ctx.logger.info('app.merge.mergeRaw:started')

    let results = []
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i]
      const tableCreated = await mergeOne(table)
      results.push(tableCreated)
    }

    ctx.logger.info('app.merge.mergeRaw:done')

    return {
      created: results
    }
  }
}

export { mergeRaw }
