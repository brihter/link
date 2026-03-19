import { loadRaw } from './loadRaw.mjs'
import { loadGraph } from './loadGraph.mjs'

const indexLoad = ctx => {
  return {
    raw: loadRaw(ctx),
    graph: loadGraph(ctx)
  }
}

export { indexLoad }
