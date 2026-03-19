import { load } from "./load.mjs"
import { save } from "./save.mjs"
import { remove } from "./remove.mjs"

const indexState = ctx => {
  return {
    load: load(ctx),
    save: save(ctx),
    remove: remove(ctx)
  }
}

export { indexState }
