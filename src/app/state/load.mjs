import { create } from "./create.mjs"

const load = ({ sqlite }) => {
  const load = async () => {
    return await sqlite.all('select * from pd_app_state order by "name" asc')
  }
  
  return async () => {
    await create({ sqlite })()
    return await load()
  }
}

export { load }
