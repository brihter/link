import { Storage } from '@brighter/storage-adapter-local'

const initStorage = async () => {
  return Storage({
    path: 'data/'
  })
}

const destroy = async () => {
  throw new Error('NotImplemented')
}

export { initStorage, destroy }
