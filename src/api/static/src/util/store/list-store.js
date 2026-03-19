Ext.ns('X.store')

class ListStore {
  cfg = {}
  keys = new Map()
  values = []

  constructor(cfg = {}) {
    mobx.makeObservable(this, {
      values: mobx.observable,

      add: mobx.action,
      remove: mobx.action,
      update: mobx.action,
      get: mobx.action
    })

    this.cfg.id = cfg.id
    this.load(cfg.values)
  }

  load(values) {
    mobx.transaction(() => {
      this.keys = new Map()
      this.values = []
      this.add(values)
    })
  }

  add(records) {
    if (!_.isArray(records)) {
      records = [records]
    }

    const addOne = record => {
      if (!record[this.cfg.id]) {
        const maxId = _.maxBy(Array.from(this.keys.keys())) || 0
        record.id = maxId + 1
      }

      this.values.push(record)
      this.keys.set(record[this.cfg.id], this.values.length - 1)
      return record
    }

    return records.map(addOne)
  }

  get(id) {
    const ix = this.keys.get(id)
    const record = this.values[ix]
    return mobx.toJS(record)
  }

  remove(id) {
    const reindex = (record, index) => {
      this.keys.set(record[this.cfg.id], index)
    }

    const record = _.cloneDeep(this.get(id))
    const index = this.keys.get(id)

    this.values.splice(index, 1)
    this.keys.delete(id)
    this.values.forEach(reindex)
    return record
  }

  clear() {
    const ids = this.values.map(v => v[this.cfg.id])
    ids.forEach(id => this.remove(id))
  }

  update(id, record) {
    const oldRecord = this.get(id)
    if (!oldRecord) {
      return
    }

    const index = this.keys.get(id)
    this.values[index] = _.defaultsDeep(record, oldRecord)

    const updatedRecord = this.get(id)
    return updatedRecord
  }

  serialize() {
    return JSON.stringify(mobx.toJS(this.values))
  }
}

X.store.ListStore = ListStore
