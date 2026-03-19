import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import express_timeout from 'connect-timeout'

import { mount } from './middleware/mount.mjs'
import { log } from './middleware/log.mjs'
import { error, notFoundError } from './middleware/error.mjs'

import { routerStatus } from './routes/status.mjs'
import { routerLoad } from './routes/load.mjs'
import { routerMerge } from './routes/merge.mjs'
import { routerSolve } from './routes/solve.mjs'
import { routerExport } from './routes/export.mjs'
import { routerAnalyze } from './routes/analyze.mjs'
import { routerVisualize } from './routes/visualize.mjs'
import { routerState } from './routes/state.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

const api = app => {
  const web = express()

  // trace
  web.use(log)

  // common
  web.disable('x-powered-by')
  web.use(express_timeout('600s'))
  web.use(express.json())
  web.use(express.urlencoded({ extended: true }))
  web.use(mount(app))

  // routes
  web.use('/load', routerLoad)
  web.use('/merge', routerMerge)
  web.use('/solve', routerSolve)
  web.use('/export', routerExport)
  web.use('/analyze', routerAnalyze)
  web.use('/visualize', routerVisualize)
  web.use('/status', routerStatus)
  web.use('/state', routerState)
  web.use('/', express.static(join(__dirname + '/static')))

  // errors
  web.use(notFoundError)
  web.use(error)

  const server = web.listen(app._ctx.config.app_port)

  app._ctx.logger.info('server:started', {
    params: {
      port: app._ctx.config.app_port
    }
  })

  return server
}

const unapi = async (server, app) => {
  server.close()
  app._ctx.logger.info('server:stopped')
}

export { api, unapi }
