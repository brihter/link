Ext.ns('X.state')

class FilterState {
  stateManager = {}
  stateManagerStates = {}
  filters = {}
  cube = {}
  view = {}
  viewOptions = {}
  _viewOptionDefaults = {}
  _nextFilterId = 1

  constructor(cfg = {}) {
    mobx.makeObservable(this, {
      filters: mobx.observable,
      filterObject: mobx.computed,
      addFilter: mobx.action,
      addFilterGroup: mobx.action,
      clearFilters: mobx.action,
      loadFilters: mobx.action,
      removeFilter: mobx.action,
      updateFilter: mobx.action
    })

    this.stateManager = new X.store.ObjectStore({ values: cfg.stateManager })
    this.stateManagerStates = new X.store.ListStore({
      id: 'id',
      values: cfg.stateManagerStates
    })
    this.cube = new X.store.ObjectStore({ values: cfg.cube })
    this.view = new X.store.ObjectStore({ values: cfg.view })

    for (const view of cfg.views) {
      const settings = { ...(view.settings || {}) }
      const attributes = { ...(view.attributes || {}) }
      this._viewOptionDefaults[view.name] = { settings, attributes }
      this.viewOptions[view.name] = {
        settings: new X.store.ObjectStore({ values: settings }),
        attributes: new X.store.ObjectStore({ values: attributes })
      }
    }
    this.getViewOptions()

    const cube = app_data.getCube(this.cube.get('name'))
    this.loadFilters(cube, cfg.filters)
  }

  getViewOptions(viewName = this.view.get('name')) {
    const options = this.viewOptions[viewName]
    if (!options) {
      throw new Error(`Unknown view: ${viewName}`)
    }
    return options
  }

  get viewSettings() {
    return this.getViewOptions().settings
  }

  get viewAttributes() {
    return this.getViewOptions().attributes
  }

  get filterObject() {
    const toKV = (acc, [key, value]) => {
      acc[key] = value
      return acc
    }
    const viewOptions = this.getViewOptions()

    return {
      cube: Object.entries(this.cube.values).reduce(toKV, {}),
      filters: this.toRequestFilter(this.filters),
      view: Object.entries(this.view.values).reduce(toKV, {}),
      viewSettings: Object.entries(viewOptions.settings.values).reduce(toKV, {}),
      viewAttributes: Object.entries(viewOptions.attributes.values).reduce(toKV, {})
    }
  }

  hasFilterValue(value) {
    if (Array.isArray(value)) {
      return value.length > 0 && value.every(item => this.hasFilterValue(item))
    }
    return (_.isString(value) && value.length > 0) ||
      (typeof value === 'number' && Number.isFinite(value))
  }

  toRequestFilter(filter) {
    if (Array.isArray(filter.filters)) {
      return {
        logic: filter.logic,
        filters: filter.filters
          .map(child => this.toRequestFilter(child))
          .filter(child => !_.isUndefined(child))
      }
    }
    if (!this.hasFilterValue(filter.value)) {
      return
    }
    return {
      attribute: filter.attribute,
      operator: filter.operator,
      value: mobx.toJS(filter.value)
    }
  }

  toSavedFilter(filter) {
    if (Array.isArray(filter.filters)) {
      return {
        logic: filter.logic,
        filters: filter.filters.map(child => this.toSavedFilter(child))
      }
    }

    const saved = {
      attribute: filter.attribute,
      operator: filter.operator
    }
    if ('value' in filter) {
      saved.value = mobx.toJS(filter.value)
    }
    return saved
  }

  normalizeFilter(cube, filter = {}) {
    if (!filter || typeof filter !== 'object') {
      filter = {}
    }

    const attributeMigrations = {
      key: 'grave_key',
      ts_from: 'grave_ts_from',
      ts_to: 'grave_ts_to',
      ts_length: 'grave_ts_length',
      ts_phase: 'grave_ts_phase',
      phase: 'grave_ts_phase',
      attr_x: 'grave_attr_x',
      attr_y: 'grave_attr_y',
      attr_azimuth: 'grave_attr_azimuth',
      attr_depth_from: 'grave_attr_depth_from',
      attr_depth_to: 'grave_attr_depth_to',
      preservation: 'grave_attr_preservation',
      attr_preservation: 'grave_attr_preservation',
      attr_body_gender: 'grave_attr_body_gender',
      attr_body_age_min: 'grave_attr_body_age_min',
      attr_body_age_max: 'grave_attr_body_age_max',
      attr_body_arm_position_code: 'grave_attr_body_arm_position_code',
      attr_skeleton_arm_code: 'grave_attr_body_arm_position_code'
    }
    const attribute = attributeMigrations[filter.attribute] || filter.attribute
    const definition = cube.filters.find(candidate => candidate.attribute === attribute)
    if (!definition) {
      return {
        attribute: cube.filters[0].attribute,
        operator: cube.filters[0].operators[0],
        value: ''
      }
    }

    const normalized = {
      attribute,
      operator: definition.operators.includes(filter.operator)
        ? filter.operator
        : definition.operators[0]
    }
    if ('value' in filter) {
      normalized.value = filter.value
    }
    return normalized
  }

  normalizeFilterGroup(cube, group) {
    const logic = String(group.logic || '').toLowerCase() === 'or' ? 'or' : 'and'
    const filters = Array.isArray(group.filters) ? group.filters : []
    return {
      logic,
      filters: filters.map(filter => {
        if (filter && typeof filter === 'object' && Array.isArray(filter.filters)) {
          return this.normalizeFilterGroup(cube, filter)
        }
        return this.normalizeFilter(cube, filter)
      })
    }
  }

  normalizeLegacyFilters(cube, filters) {
    const grouped = new Map()
    for (const input of filters) {
      const filter = this.normalizeFilter(cube, input)
      const values = Array.isArray(filter.value) ? filter.value : [filter.value]
      for (const value of values) {
        const leaf = { ...filter, value }
        const key = JSON.stringify([leaf.attribute, leaf.operator])
        if (!grouped.has(key)) {
          grouped.set(key, [])
        }
        grouped.get(key).push(leaf)
      }
    }

    const normalized = []
    for (const filtersWithSameOperation of grouped.values()) {
      const operator = filtersWithSameOperation[0].operator
      if (filtersWithSameOperation.length > 1 && ['in', 'like'].includes(operator)) {
        normalized.push({
          logic: 'or',
          filters: filtersWithSameOperation
        })
      } else {
        normalized.push(...filtersWithSameOperation)
      }
    }
    return { logic: 'and', filters: normalized }
  }

  assignFilterIds(filter) {
    const id = this._nextFilterId++
    if (Array.isArray(filter.filters)) {
      return {
        id,
        logic: filter.logic,
        filters: filter.filters.map(child => this.assignFilterIds(child))
      }
    }
    return { id, ...filter }
  }

  loadFilters(cube, filters) {
    this._nextFilterId = 1
    const normalized = Array.isArray(filters)
      ? this.normalizeLegacyFilters(cube, filters)
      : this.normalizeFilterGroup(cube, filters || {})
    this.filters = this.assignFilterIds(normalized)
  }

  findFilter(id, filter = this.filters) {
    if (filter.id === id) {
      return filter
    }
    if (!Array.isArray(filter.filters)) {
      return
    }
    for (const child of filter.filters) {
      const found = this.findFilter(id, child)
      if (found) {
        return found
      }
    }
  }

  findFilterParent(id, group = this.filters) {
    if (!Array.isArray(group.filters)) {
      return
    }
    for (const child of group.filters) {
      if (child.id === id) {
        return group
      }
      const found = this.findFilterParent(id, child)
      if (found) {
        return found
      }
    }
  }

  addFilter(groupId, filter) {
    const group = this.findFilter(groupId)
    if (!group || !Array.isArray(group.filters)) {
      return
    }

    const cube = app_data.getCube(this.cube.get('name'))
    const added = this.assignFilterIds(this.normalizeFilter(cube, filter))
    group.filters.push(added)
    return mobx.toJS(added)
  }

  addFilterGroup(groupId, filter) {
    const group = this.findFilter(groupId)
    if (!group || !Array.isArray(group.filters)) {
      return
    }

    const cube = app_data.getCube(this.cube.get('name'))
    const filters = filter ? [this.normalizeFilter(cube, filter)] : []
    const added = this.assignFilterIds({ logic: 'and', filters })
    group.filters.push(added)
    return mobx.toJS(added)
  }

  updateFilter(id, changes) {
    const filter = this.findFilter(id)
    if (!filter) {
      return
    }
    if (Array.isArray(filter.filters)) {
      const logic = String(changes.logic || '').toLowerCase()
      if (['and', 'or'].includes(logic)) {
        filter.logic = logic
      }
      return mobx.toJS(filter)
    }

    const cube = app_data.getCube(this.cube.get('name'))
    const normalized = this.normalizeFilter(cube, { ...filter, ...changes })
    filter.attribute = normalized.attribute
    filter.operator = normalized.operator
    if ('value' in normalized) {
      filter.value = normalized.value
    } else {
      delete filter.value
    }
    return mobx.toJS(filter)
  }

  removeFilter(id) {
    const parent = this.findFilterParent(id)
    if (!parent) {
      return
    }
    const index = parent.filters.findIndex(filter => filter.id === id)
    const removed = parent.filters.splice(index, 1)
    return removed.length > 0 ? mobx.toJS(removed[0]) : undefined
  }

  clearFilters() {
    const cube = app_data.getCube(this.cube.get('name'))
    this.loadFilters(cube, [])
  }

  loadViewOptionValues(store, defaults, values) {
    const savedValues = values && typeof values === 'object' ? values : {}
    for (const [key, defaultValue] of Object.entries(defaults)) {
      const value = Object.prototype.hasOwnProperty.call(savedValues, key)
        ? savedValues[key]
        : defaultValue
      store.set(key, value)
    }
  }

  loadViewOptions(savedViewOptions = {}) {
    const savedOptions =
      savedViewOptions && typeof savedViewOptions === 'object' && !Array.isArray(savedViewOptions)
        ? savedViewOptions
        : {}

    for (const [viewName, defaults] of Object.entries(this._viewOptionDefaults)) {
      const savedView = savedOptions[viewName] || {}
      const options = this.getViewOptions(viewName)
      this.loadViewOptionValues(options.settings, defaults.settings, savedView.settings)
      this.loadViewOptionValues(options.attributes, defaults.attributes, savedView.attributes)
    }
  }

  normalizeSavedViewOptions(savedState) {
    if (
      savedState.viewOptions &&
      typeof savedState.viewOptions === 'object' &&
      !Array.isArray(savedState.viewOptions)
    ) {
      return savedState.viewOptions
    }

    const viewName = (savedState.view && savedState.view.name) || this.view.get('name')
    return {
      [viewName]: {
        settings: savedState.viewSettings || {},
        attributes: savedState.viewAttributes || {}
      }
    }
  }

  serializeViewOptions() {
    const serialized = {}
    for (const [viewName, options] of Object.entries(this.viewOptions)) {
      serialized[viewName] = {
        settings: mobx.toJS(options.settings.values),
        attributes: mobx.toJS(options.attributes.values)
      }
    }
    return serialized
  }

  load(state = '') {
    if (state.length === 0) {
      return
    }

    const savedState = JSON.parse(state)
    mobx.transaction(() => {
      this.cube.load(savedState.cube || this.cube.values)
      const cube = app_data.getCube(this.cube.get('name'))
      this.loadFilters(cube, savedState.filters)
      this.view.load(savedState.view || this.view.values)
      this.getViewOptions()
      this.loadViewOptions(this.normalizeSavedViewOptions(savedState))
    })
  }

  serialize() {
    return JSON.stringify({
      cube: this.cube.values,
      filters: this.toSavedFilter(this.filters),
      view: this.view.values,
      viewOptions: this.serializeViewOptions()
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
