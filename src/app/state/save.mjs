import { create } from "./create.mjs"
import { pd_app_state } from './table/pd_app_state.mjs'
import { getColumnNames, getValuePlaceholders } from '../../util/table.mjs'

const save = ({ sqlite }) => {
  const save = async (rec) => {
    const r = await sqlite.all(`select max(id) as id from ${pd_app_state.name}`)

    let nextId = 1
    if (r && r.length > 0) {
      nextId = r[0].id + 1
    }

    const statement = `
      insert into ${pd_app_state.name} (
        ${getColumnNames(pd_app_state)}
      ) values (
        ${getValuePlaceholders(pd_app_state)}
      )
    `

    await sqlite.run(statement, [rec.scope, nextId, rec.name, rec.state])
  }

  return async (params = {}) => {
    await create({ sqlite })()
    await save(params)
  }
}

export { save }
