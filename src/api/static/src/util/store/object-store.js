Ext.ns('X.store')

class ObjectStore {
  values = {}

  constructor(cfg) {
    mobx.makeObservable(this, {
      values: mobx.observable
    })

    this.load(cfg.values)
  }

  load(values) {
    Object.entries(values).forEach(([key, val]) => {
      this.set(key, val)
    })
  }

  set(key = '', val = '') {
    this.values[key] = val
  }

  get(key = '') {
    return this.values[key]
  }

  serialize() {
    return JSON.stringify(mobx.toJS(this.values))
  }
}

X.store.ObjectStore = ObjectStore
