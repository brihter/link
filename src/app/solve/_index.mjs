import { assignTurbochron } from './assignTurbochron.mjs'


const indexSolve = ctx => {
  const { logger } = ctx

  const steps = [
    assignTurbochron(ctx)
  ]

  const solve = async () => {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      await step.solve()
      logger.info('app.solve.solveStep:done', { params: { step: step.name } })
    }

    logger.info('app.solve:done')
    return { success: true }
  }

  return async () => {
    return await solve(ctx)
  }
}

export { indexSolve }
