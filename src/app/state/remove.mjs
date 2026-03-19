import { create } from "./create.mjs"
import { pd_app_state } from './table/pd_app_state.mjs'

const remove = ({ sqlite }) => {
  const remove = async (id) => {
    const statement = `delete from ${pd_app_state.name} where id = ?`
    await sqlite.run(statement, [id])
  }

  return async (id) => {
    await create({ sqlite })()
    await remove(id)
  }
}

export { remove }
