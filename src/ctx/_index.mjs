import { initConfig } from './providers/config.mjs'
import { initVersion } from './providers/version.mjs'
import { initTimezone } from './providers/timezone.mjs'
import { initTrace } from './providers/trace.mjs'
import { initLogger } from './providers/logger.mjs'
import { initStorage } from './providers/storage.mjs'
import { initSQLite } from './providers/sqlite.mjs'
import { initNeo4J, destroyNeo4J } from './providers/neo4j.mjs'

const ctx = async (bootConfig = {}) => {
  const environment = process.env.NODE_ENV || 'local'

  const version = await initVersion()
  const config = await initConfig({ environment, bootConfig })
  const timezone = await initTimezone()
  const trace = await initTrace()
  const logger = await initLogger({ config, trace })
  const storage = await initStorage()
  const sqlite = await initSQLite()
  const neo4j = await initNeo4J({ config })

  const scope = async (ctx, scope) => {
    const scopedTrace = await initTrace(scope.trace)
    const scopedLogger = await initLogger({ config, trace: scopedTrace })

    return {
      ...ctx,
      trace: scopedTrace,
      logger: scopedLogger
    }
  }

  return {
    version,
    config,
    timezone,
    trace,
    logger,
    storage,
    sqlite,
    neo4j,

    scope
  }
}

const unctx = async ctx => {
  ctx = await destroyNeo4J(ctx)
}

export { ctx, unctx }
