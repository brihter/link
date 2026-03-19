import { exportGraph } from './exportGraph.mjs'

const indexExport = ctx => {
  return {
    graph: exportGraph(ctx)
  }
}

export { indexExport }
