import { mergeRaw } from './mergeRaw.mjs'

const indexMerge = ctx => {
  return {
    raw: mergeRaw(ctx)
  }
}

export { indexMerge }
