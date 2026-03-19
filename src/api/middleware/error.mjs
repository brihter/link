import { Unauthorized, InvalidArgument, NotFound } from '../../util/error.mjs'

const notFoundError = async (req, res) => {
  req.logger.warn('api:failed', {
    params: {
      reason: 'non-existing route',
      route: req.originalUrl
    }
  })

  return res.status(404).json({
    message: 'NotFound'
  })
}

const error = async (err, req, res, next) => {
  if (err instanceof Unauthorized) {
    req.logger.warn('api:failed', {
      params: {
        reason: 'unauthorized',
        route: req.originalUrl
      }
    })

    return res.status(401).json({
      message: 'Unauthorized'
    })
  }

  if (err instanceof InvalidArgument) {
    req.logger.warn('api:failed', {
      params: {
        reason: 'invalid argument',
        route: req.originalUrl
      }
    })

    return res.status(400).json({
      message: 'InvalidArgument'
    })
  }

  if (err instanceof NotFound) {
    return await notFoundError(req, res)
  }

  if (req.logger) {
    req.logger.error('api:failed', {
      params: {
        reason: err.message,
        stack: err.stack
      }
    })
  } else {
    console.log(err)
  }
  
  res.status(500).json({
    message: 'Error'
  })
}

export { notFoundError, error }
