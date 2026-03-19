import { v4 as uuid } from 'uuid'

const initTrace = async (ctx = {}) => {
  return {
    id: ctx?.trace?.id || uuid()
  }
}

const destroy = async () => {
  throw new Error('NotImplemented')
}

export { initTrace, destroy }
