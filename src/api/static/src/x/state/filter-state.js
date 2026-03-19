Ext.ns('X.state')

class FilterState {
  stateManager = {}
  stateManagerStates = {}
  filters = {}
  view = {}
  viewSettings = {}
  viewAttributes = {}

  constructor(cfg = {}) {
    mobx.makeObservable(this, {
      filterObject: mobx.computed
    })

    this.stateManager = new X.store.ObjectStore({ values: cfg.stateManager })
    this.stateManagerStates = new X.store.ListStore({
      id: 'id',
      values: cfg.stateManagerStates
    })
    this.filters = new X.store.ListStore({ id: 'id', values: cfg.filters })
    this.view = new X.store.ObjectStore({ values: cfg.view })
    this.viewSettings = new X.store.ObjectStore({ values: cfg.viewSettings })
    this.viewAttributes = new X.store.ObjectStore({
      values: cfg.viewAttributes
    })
  }

  get filterObject() {
    const filter = {
      filters: [],
      view: {},
      viewSettings: {},
      viewAttributes: {}
    }

    const toFilter = f => {
      const v = mobx.toJS(f)
      if (_.isString(v.value) && v.value.length > 0) {
        delete v.id
        return v
      }
    }

    const toKV = (acc, [key, value]) => {
      acc[key] = value
      return acc
    }

    filter.filters = this.filters.values
      .map(toFilter)
      .filter(v => !_.isUndefined(v))
    filter.view = Object.entries(this.view.values).reduce(toKV, {})
    filter.viewSettings = Object.entries(this.viewSettings.values).reduce(
      toKV,
      {}
    )
    filter.viewAttributes = Object.entries(this.viewAttributes.values).reduce(
      toKV,
      {}
    )

    return filter
  }

  load(state = '') {
    if (state.length === 0) {
      return
    }

    const savedState = JSON.parse(state)

    this.filters.load(savedState.filters)
    this.view.load(savedState.view)
    this.viewSettings.load(savedState.viewSettings)
    this.viewAttributes.load(savedState.viewAttributes)
  }

  serialize() {
    return JSON.stringify({
      filters: this.filters.values,
      view: this.view.values,
      viewSettings: this.viewSettings.values,
      viewAttributes: this.viewAttributes.values
    })
  }

  async fetchStates() {
    return new Promise((resolve, reject) => {
      Ext.Ajax.request({
        url: `/state/load`,
        method: 'GET',
        success: res => {
          this.stateManagerStates.load(JSON.parse(res.responseText))
          resolve(res.responseText)
        },
        failure: res => {
          reject('')
        }
      })
    })
  }

  async saveState(params) {
    return new Promise((resolve, reject) => {
      Ext.Ajax.request({
        url: '/state/save/',
        method: 'POST',
        jsonData: JSON.stringify(params),
        success: res => {
          const states = JSON.parse(res.responseText)
          const lastState = _.maxBy(states, (s) => s.id)
          const lastStateId = lastState.id

          this.stateManager.set('selected', lastStateId)
          this.stateManagerStates.load(states)

          resolve(res.responseText)
        },
        failure: res => {
          reject('')
        }
      })
    })
  }

  async removeState(id) {
    return new Promise((resolve, reject) => {
      Ext.Ajax.request({
        url: `/state/remove/${id}`,
        method: 'GET',
        success: res => {
          const states = JSON.parse(res.responseText)
          this.stateManager.set('selected', 1)
          this.stateManagerStates.load(states)
          resolve(res.responseText)
        },
        failure: res => {
          reject('')
        }
      })
    })
  }
}

X.state.FilterState = FilterState
