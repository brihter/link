import { readFile } from 'node:fs/promises'

const initVersion = async () => {
  let version = ''
  
  try {
    version = await readFile('VERSION', { encoding: 'ascii' })
  } catch (error) {
    version = 'latest'
  }

  version = version.replace(/\r?\n|\r/g, ' ')
  version = version.trim()

  return version
}

const destroy = async () => {
  throw new Error('NotImplemented')
}

export { initVersion, destroy }
