import process from 'node:process'

import { app } from './app/_index.mjs'
import { ctx, unctx } from './ctx/_index.mjs'
import { api, unapi } from './api/_index.mjs'

const boot = async (opts = {}) => {
  return await app(await ctx(opts))
}

const shutdown = async (serverInstance, apiInstance) => {
  await unapi(serverInstance, apiInstance)
  await unctx(apiInstance._ctx)
}

const main = async () => {
  const apiInstance = await boot()
  const serverInstance = api(apiInstance)
  process.on('SIGINT', () => shutdown(serverInstance, apiInstance))
  process.on('SIGTERM', () => shutdown(serverInstance, apiInstance))
}

main().catch(console.error)
