import { indexLoad } from './load/_index.mjs'
import { indexMerge } from './merge/_index.mjs'
import { indexAnalyze } from './analyze/_index.mjs'
import { indexSolve } from './solve/_index.mjs'
import { indexExport } from './export/_index.mjs'
import { indexVisualize } from './visualize/_index.mjs'
import { indexState } from './state/_index.mjs'

const app = async ctx => {
  const scope = async scope => {
    const scopedCtx = await ctx.scope(ctx, scope)
    return app(scopedCtx)
  }

  return {
    _ctx: ctx,
    scope,

    load: indexLoad(ctx),
    merge: indexMerge(ctx),
    solve: indexSolve(ctx),
    export: indexExport(ctx),
    analyze: indexAnalyze(ctx),
    visualize: indexVisualize(ctx),
    state: indexState(ctx)
  }
}

export { app }
