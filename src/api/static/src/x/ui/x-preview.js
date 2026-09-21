Ext.ns('X')

const TABLE_PAGE_SIZE = 200

const viewRequestError = (response, resource) => {
  let reason = `HTTP ${response.status}`
  if (response.isTimeout) {
    reason = 'request timed out'
  } else if (response.isAbort) {
    reason = 'request cancelled'
  } else if (!response.status) {
    reason = 'network connection failed'
  }
  return new Error(`Could not load ${resource}: ${reason}.`)
}

X.View = Ext.extend(Ext.Panel, {
  _afterLayout: false,
  _requestId: 0,

  constructor: function (config) {
    this.GraphCubeLabel = new Ext.Toolbar.TextItem({
      cls: 'view-cube-label',
      text: ''
    })

    this.Graph = new Ext.Panel({
      autoScroll: true,
      border: false,
      tbar: {
        type: 'toolbar',
        cls: 'overview-tbar-options',
        items: [
          this.GraphCubeLabel,
          '->',
          // keep the dot preview available in code, but hide its toolbar button for now
          // {
          //   xtype: 'button',
          //   text: 'Show DOT',
          //   iconCls: 'icn_grid-dot',
          //   handler: this.onShowDOT.createDelegate(this)
          // },
          {
            xtype: 'button',
            text: 'Show SVG',
            iconCls: 'icn_layer-shape-polygon',
            handler: this.onShowSVG.createDelegate(this)
          },
          {
            xtype: 'tbseparator'
          },
          {
            xtype: 'button',
            text: 'Download SVG',
            iconCls: 'icn_drive-download',
            handler: this.onDownload.createDelegate(this, ['svg'])
          }
          // keep png export available in code, but hide its toolbar button for now
          // {
          //   xtype: 'button',
          //   text: 'Download PNG',
          //   iconCls: 'icn_image',
          //   handler: this.onDownload.createDelegate(this, ['png'])
          // }
        ]
      }
    })

    const tableStore = new Ext.data.JsonStore({
      autoDestroy: true,
      fields: []
    })
    this.TablePaging = new Ext.PagingToolbar({
      cls: 'table-paging-toolbar',
      displayInfo: true,
      emptyMsg: 'No records to display',
      items: [
        {
          xtype: 'label',
          cls: 'table-shortcuts',
          html: [
            'Shortcuts: <strong>Ctrl + Click</strong> - Include, ',
            '<strong>Ctrl + Shift + Click</strong> - Exclude'
          ].join('')
        }
      ],
      pageSize: TABLE_PAGE_SIZE,
      store: tableStore
    })
    this.TableCubeLabel = new Ext.Toolbar.TextItem({
      cls: 'view-cube-label',
      text: ''
    })

    this.Table = new Ext.grid.GridPanel({
      bbar: this.TablePaging,
      border: false,
      colModel: new Ext.grid.ColumnModel([]),
      store: tableStore,
      tbar: {
        type: 'toolbar',
        items: [
          this.TableCubeLabel,
          '->',
          {
            xtype: 'button',
            text: 'Export CSV',
            iconCls: 'icn_document-excel-csv',
            handler: this.onExportCSV.createDelegate(this)
          }
        ]
      },
      viewConfig: {
        deferEmptyText: false,
        emptyText: '<div class="view-message">No records.</div>'
      },
      listeners: {
        cellclick: this.onTableCellClick.createDelegate(this)
      }
    })

    this.bbar = {
      xtype: 'toolbar',
      cls: 'overview-bbar-status',
      height: 27,
      items: [
        {
          xtype: 'label',
          ref: '../Legend',
          cls: 'view-legend',
          html: [
            'Legend: ',
            '<span class="view-legend-swatch view-legend-selected" aria-hidden="true"></span>',
            'Selected ',
            '<span class="view-legend-swatch view-legend-c14" aria-hidden="true"></span>',
            'C14'
          ].join('')
        },
        '->',
        {
          xtype: 'label',
          ref: '../Status',
          text: 'No data',
          style: 'display: block;line-height:22px;margin-right:2px;',
          height: 22
        }
      ]
    }

    config = Ext.apply({}, config)
    config.activeItem = 0
    config.items = [this.Graph, this.Table]
    config.layout = 'card'

    X.View.superclass.constructor.apply(this, [config])

    this.on('afterlayout', this._onAfterLayout, this, { single: true })
    this._contentKey = null
    this._disposeState = mobx.autorun(() => {
      const filter = this.state.filterState.filterObject
      if (!this._afterLayout) {
        this._pendingFilter = filter
        return
      }
      this.handleStateChange(filter)
    })
    this.on(
      'destroy',
      function () {
        this._disposeState()
      },
      this
    )
  },

  _onAfterLayout: function () {
    this._afterLayout = true
    const filter = this._pendingFilter || this.state.filterState.filterObject
    this._pendingFilter = null
    this.handleStateChange(filter)
  },

  getContentFilterKey: function (filter) {
    if (!filter.view || filter.view.name !== 'table') {
      return JSON.stringify(filter)
    }

    const viewSettings = Object.entries(filter.viewSettings || {}).reduce(
      (settings, [key, value]) => {
        if (!key.startsWith('columns.')) {
          settings[key] = value
        }
        return settings
      },
      {}
    )
    return JSON.stringify({ ...filter, viewSettings })
  },

  handleStateChange: function (filter) {
    const contentKey = this.getContentFilterKey(filter)
    if (contentKey === this._contentKey && filter.view && filter.view.name === 'table') {
      this.setTableColumnVisibility(filter.viewSettings)
      return
    }

    this._contentKey = contentKey
    this.onStateChange(filter)
  },

  setTableColumnVisibility: function (settings = {}) {
    const columnModel = this.Table.getColumnModel()
    for (let columnIndex = 0; columnIndex < columnModel.getColumnCount(); columnIndex++) {
      const columnKey = columnModel.getDataIndex(columnIndex)
      const hidden = settings[`columns.${columnKey}`] === false
      if (columnModel.isHidden(columnIndex) !== hidden) {
        columnModel.setHidden(columnIndex, hidden)
      }
    }
  },

  fetchContent: async function (filter) {
    return new Promise((resolve, reject) => {
      Ext.Ajax.request({
        url: `/visualize/${filter.view.name}`,
        method: 'POST',
        jsonData: filter,
        timeout: 0,
        success: res => {
          resolve(res.responseText)
        },
        failure: res => {
          reject(viewRequestError(res, 'view content'))
        }
      })
    })
  },

  fetchStats: async function (filter) {
    return new Promise((resolve, reject) => {
      Ext.Ajax.request({
        url: `/visualize/${filter.view.name}/stats`,
        method: 'POST',
        jsonData: filter,
        timeout: 0,
        success: res => {
          try {
            resolve(JSON.parse(res.responseText))
          } catch (error) {
            reject(error)
          }
        },
        failure: res => {
          reject(viewRequestError(res, 'view statistics'))
        }
      })
    })
  },

  loadTable: function () {
    const store = this.Table.store
    return new Promise((resolve, reject) => {
      store.load({
        params: { start: 0, limit: TABLE_PAGE_SIZE },
        callback: (_records, _options, success) => {
          if (!success) {
            reject(new Error('Could not load table data'))
            return
          }
          resolve({ Rows: store.getTotalCount() })
        }
      })
    })
  },

  prepareTableRequest: function (options, filter) {
    const params = options.params || {}
    const start = Number(params.start) || 0
    const request = {
      ...filter,
      page: Math.floor(start / TABLE_PAGE_SIZE) + 1
    }
    if (params.sort) {
      request.sort = {
        attribute: params.sort,
        direction: params.dir
      }
    }
    options.params = { ...params, jsonData: request }

    if (this._activeViewName === 'table' && this._mask) {
      this._mask.show()
    }
  },

  onTableLoad: function (store) {
    if (store !== this.Table.store || this._activeViewName !== 'table') {
      return
    }
    this.renderStatus(null, { Rows: store.getTotalCount() })
    if (this._mask) {
      this._mask.hide()
    }
  },

  onTableLoadException: function (store) {
    if (store !== this.Table.store || this._activeViewName !== 'table') {
      return
    }
    this.renderStatus(new Error('Could not load table data.'), {})
    if (this._mask) {
      this._mask.hide()
    }
  },

  onStateChange: async function (filter = {}) {
    const requestId = ++this._requestId
    const viewName = filter.view && filter.view.name
    const isTable = viewName === 'table'
    this._activeViewName = viewName

    if (this._mask) {
      this._mask.show()
    }

    const state = {
      error: null,
      content: '',
      stats: {}
    }

    try {
      const cube = filter.cube && app_data.getCube(filter.cube.name)
      const cubeLabel = cube ? Ext.util.Format.htmlEncode(cube.label) : ''
      const cubeLabelText = `Cube: <strong>${cubeLabel}</strong>`
      this.GraphCubeLabel.setText(cubeLabelText)
      this.TableCubeLabel.setText(cubeLabelText)

      if (isTable) {
        const columns = cube && Array.isArray(cube.columns) ? cube.columns : []
        this.configureTable(columns, filter)
        state.stats = await this.loadTable()
        state.content = true
      } else {
        const [content, stats] = await Promise.all([
          this.fetchContent(filter),
          this.fetchStats(filter)
        ])
        state.content = content
        state.stats = stats
      }
    } catch (error) {
      state.error = error
    }

    if (requestId !== this._requestId) {
      return
    }

    if (isTable) {
      this.renderTableState(state)
    } else {
      this.renderGraphState(state)
    }

    if (this._mask) {
      this._mask.hide()
    }
  },

  renderGraphState: function (state) {
    const content = state.error
      ? `<div class="view-message">${Ext.util.Format.htmlEncode(state.error.message)}</div>`
      : state.content

    this.showGraph()
    this.Graph.update(content)
    this.renderStatus(state.error, state.stats)
    this.attachListeners()
    this.centerScrollPosition(this.Graph.body.dom)
  },

  renderTableState: function (state) {
    this.showTable()

    if (state.error || !state.content) {
      const error = state.error || new Error('Could not load this view.')
      this.setTableEmptyText(error.message)
      this.Table.store.removeAll()
      this.renderStatus(error, {})
      return
    }

    this.setTableEmptyText('No data matches the current filter.')
    this.renderStatus(null, state.stats)
  },

  configureTable: function (columns, filter) {
    const filteredAttributes = new Set()
    const collectAttributes = node => {
      if (node && Array.isArray(node.filters)) {
        node.filters.forEach(collectAttributes)
      } else if (node && node.attribute) {
        filteredAttributes.add(node.attribute)
      }
    }
    collectAttributes(filter.filters)
    const fields = columns.map(column => ({ name: column.key }))
    const store = new Ext.data.JsonStore({
      autoDestroy: true,
      fields,
      proxy: new Ext.data.HttpProxy({
        method: 'POST',
        url: '/visualize/table/data'
      }),
      remoteSort: true,
      root: 'content.rows',
      totalProperty: 'stats.Rows'
    })
    store.on('beforeload', (_store, options) => {
      this.prepareTableRequest(options, this.state.filterState.filterObject)
    })
    store.on('load', () => this.onTableLoad(store))
    store.on('exception', () => this.onTableLoadException(store))

    const columnModel = new Ext.grid.ColumnModel(
      columns.map(column => ({
        header: filteredAttributes.has(column.key)
          ? `<strong class="table-filtered-header">${Ext.util.Format.htmlEncode(column.label)}</strong>`
          : Ext.util.Format.htmlEncode(column.label),
        dataIndex: column.key,
        hidden: filter.viewSettings[`columns.${column.key}`] === false,
        menuDisabled: true,
        renderer: this.renderTableCell,
        sortable: true,
        width: column.key.endsWith('_notes') ? 280 : 140
      }))
    )

    this.Table.reconfigure(store, columnModel)
    this.TablePaging.bindStore(store)
  },

  renderTableCell: function (value) {
    if (value === null || typeof value === 'undefined') {
      return ''
    }
    if (typeof value === 'object') {
      value = Ext.encode(value)
    }
    return Ext.util.Format.htmlEncode(String(value))
  },

  setTableEmptyText: function (message) {
    const view = this.Table.getView()
    view.emptyText = `<div class="view-message">${Ext.util.Format.htmlEncode(message)}</div>`
    if (this.Table.rendered) {
      view.refresh()
    }
  },

  renderStatus: function (error, stats) {
    const status = error
      ? error.message
      : Object.entries(stats)
        .map(([key, value]) => `${key}: ${value}`)
        .join(' ')
    this.Status.update(Ext.util.Format.htmlEncode(status))
  },

  showGraph: function () {
    this.getLayout().setActiveItem(this.Graph)
    this.getBottomToolbar().show()
    this.Legend.show()
    this.doLayout()
  },

  showTable: function () {
    this.getLayout().setActiveItem(this.Table)
    this.getBottomToolbar().hide()
    this.Legend.hide()
    this.doLayout()
  },

  attachListeners: function () {
    const labels = document.querySelectorAll(`#${this.Graph.body.id} svg text`)
    for (let i = 0; i < labels.length; i++) {
      labels[i].addEventListener('click', this.onNodeClick.createDelegate(this))
    }
  },

  centerScrollPosition: function (container) {
    const scrollWidth = container.scrollWidth
    const scrollHeight = container.scrollHeight
    const viewportWidth = container.clientWidth
    const viewportHeight = container.clientHeight
    const scrollLeft = (scrollWidth - viewportWidth) / 2
    const scrollTop = (scrollHeight - viewportHeight) / 2
    container.scrollLeft = scrollLeft
    container.scrollTop = scrollTop
  },

  addValueFilter: function (attribute, value, operator = 'in') {
    if (value === null || typeof value === 'undefined') {
      return
    }

    this.state.filterState.addFilter(this.state.filterState.filters.id, {
      attribute,
      operator,
      value
    })
  },

  onTableCellClick: function (table, rowIndex, columnIndex, event) {
    if (!event.ctrlKey) {
      return
    }

    const attribute = table.getColumnModel().getDataIndex(columnIndex)
    const value = table.getStore().getAt(rowIndex).get(attribute)
    const operator = event.shiftKey ? 'not in' : 'in'
    this.addValueFilter(attribute, value, operator)
  },

  onNodeClick: function (event) {
    if (!event.ctrlKey) {
      return
    }

    this.addValueFilter('grave_key', event.target.innerHTML)
  },

  onShowDOT: function () {
    const filter = this.state.filterState.filterObject
    const url = `/visualize/${filter.view.name}.dot?filter=${encodeURIComponent(
      JSON.stringify(filter)
    )}`
    X.util.download(url)
  },

  onShowSVG: function () {
    const filter = this.state.filterState.filterObject
    const url = `/visualize/${filter.view.name}.svg?filter=${encodeURIComponent(
      JSON.stringify(filter)
    )}`
    X.util.download(url)
  },

  onExportCSV: function () {
    const columnModel = this.Table.getColumnModel()
    const exportColumns = []
    for (let columnIndex = 0; columnIndex < columnModel.getColumnCount(); columnIndex++) {
      if (!columnModel.isHidden(columnIndex)) {
        exportColumns.push(columnModel.getDataIndex(columnIndex))
      }
    }

    if (exportColumns.length === 0) {
      Ext.MessageBox.alert('Export CSV', 'At least one table column must be visible.')
      return
    }

    const filter = {
      ...this.state.filterState.filterObject,
      exportColumns
    }
    const sort = this.Table.store.getSortState()
    if (sort) {
      filter.sort = {
        attribute: sort.field,
        direction: sort.direction
      }
    }
    this.onDownload('csv', filter)
  },

  onDownload: function (format, filter = this.state.filterState.filterObject) {
    const url = `/visualize/${
      filter.view.name
    }.${format}/download?filter=${encodeURIComponent(JSON.stringify(filter))}`
    X.util.download(url)
  },

  onResize: function (adjustedWidth, adjustedHeight, rawWidth, rawHeight) {
    X.View.superclass.onResize.apply(this, [
      adjustedWidth,
      adjustedHeight,
      rawWidth,
      rawHeight
    ])
    if (!this._mask) {
      this._mask = new Ext.LoadMask(this.body, { msg: 'Loading ...' })
    }
  }
})

Ext.reg('x-view', X.View)
