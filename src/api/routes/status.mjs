import express from 'express'
import expressAsyncHandler from 'express-async-handler'

const routerStatus = express.Router()

routerStatus.get(
  '/',
  expressAsyncHandler(async (req, res) => {
    const status = {
      name: 'link',
      status: 'OK',
      version: req.app._ctx.version
    }

    req.logger.info('app.status:done', {
      params: {
        status
      }
    })

    res.json(status)
  })
)

export { routerStatus }
