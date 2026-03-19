import { readFile } from 'node:fs/promises'

const initConfig = async ({ environment, bootConfig }) => {
  let config = {}
  config = await readFile(`env/${environment}.json`, { encoding: 'ascii' })
  config = JSON.parse(config)

  return Object.assign(
    {
      role: bootConfig.role || 'worker'
    },
    config
  )
}

const destroy = async () => {
  throw new Error('NotImplemented')
}

export { initConfig, destroy }
