import { v4 as uuid } from 'uuid'

const mount = app => async (req, res, next) => {
  req.app = await app.scope({
    trace: {
      id: uuid()
    }
  })

  req.logger = req.app._ctx.logger

  next()
}

export { mount }
