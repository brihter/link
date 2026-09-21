import { omit } from 'lodash-es'

const hrToMs = hrend => (hrend[0] * 1e9 + hrend[1]) / 1e6

const omitHeaders = [
  'cookie',
  'if-none-match',
  'connection',
  'accept',
  'accept-encoding',
  'accept-language',
  'authorization',
  'x-apigateway-context',
  'x-apigateway-event'
]

// prettier-ignore
const staticExtensions = new Set([
  'js',
  'css',
  'gif',
  'jpg',
  'png',
  'ico',
  'svg'
])

const isStatic = req => {
  const extension = req.originalUrl.split('.').pop()
  return staticExtensions.has(extension) ? true : false
}

const log = (req, res, next) => {
  if (isStatic(req)) {
    return next()
  }

  const timer = {
    start: process.hrtime(),
    stop: 0,
    elapsed: 0
  }

  res.on('close', () => {
    timer.stop = process.hrtime(timer.start)
    timer.elapsed = hrToMs(timer.stop)

    const entry = {
      params: {
        status: res.headersSent ? res.statusCode : null,
        method: req.method,
        url: req.originalUrl,
        headers: omit(req.headers, omitHeaders),
        elapsed: timer.elapsed
      }
    }

    if (res.writableFinished) {
      req.logger.info('api:request', entry)
    } else {
      req.logger.warn('api:aborted', entry)
    }
  })

  next()
}

export { log }
