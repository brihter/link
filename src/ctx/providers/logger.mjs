import { isObject, isString } from 'lodash-es'
import pino from 'pino'

const initLogger = async ({ config, trace, overrides = {} }) => {
  const baseLogger = pino({
    name: config.app_name || 'app',
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    level: overrides.level
      ? overrides.level
      : pino.levels.values[config.log_level || 'debug'],
    hooks: {
      logMethod: function (args, method) {
        if (isObject(args[1]) && isString(args[0])) {
          args = [args[1], args[0]]
        }

        method.apply(this, args)
      }
    },
    formatters: {
      level(label) {
        return { level: label }
      }
    },
    redact: {
      paths: ['hostname'],
      remove: true
    }
  })

  return baseLogger.child({
    environment: process.env.NODE_ENV,
    traceId: trace.id
  })
}

const destroy = async () => {
  throw new Error('NotImplemented')
}

export { initLogger, destroy }
