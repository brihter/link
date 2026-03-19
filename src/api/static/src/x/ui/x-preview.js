Ext.ns('X')

X.View = Ext.extend(Ext.Panel, {
  _afterLayout: false,
  autoScroll: true,

  constructor: function (config) {
    this.tbar = {
      type: 'toolbar',
      cls: 'overview-tbar-options',
      items: [
        '->',
        {
          xtype: 'button',
          text: 'Show DOT',
          iconCls: 'icn_grid-dot',
          handler: this.onShowDOT.createDelegate(this)
        },
        {
          xtype: 'tbseparator'
        },
        {
          xtype: 'button',
          text: 'Show SVG',
          iconCls: 'icn_layer-shape-polygon',
          handler: this.onShowSVG.createDelegate(this)
        },
        {
          xtype: 'button',
          text: 'Download SVG',
          iconCls: 'icn_drive-download',
          handler: this.onDownload.createDelegate(this, ['svg'])
        },
        {
          xtype: 'button',
          text: 'Download PNG',
          iconCls: 'icn_image',
          handler: this.onDownload.createDelegate(this, ['png'])
        }
      ]
    }

    this.bbar = {
      xtype: 'toolbar',
      height: 27,
      items: [
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

    X.View.superclass.constructor.apply(this, [config])

    this.on('afterlayout', this._onAfterLayout.createDelegate(this))

    mobx.autorun(() => this.onStateChange(this.state.filterState.filterObject))
  },

  _onAfterLayout: function () {
    this._afterLayout = true
  },

  fetchContent: async function (filter) {
    return new Promise((resolve, reject) => {
      Ext.Ajax.request({
        url: `/visualize/${filter.view.name}`,
        method: 'POST',
        jsonData: filter,
        success: res => {
          resolve(res.responseText)
        },
        failure: res => {
          reject('')
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
        success: res => {
          resolve(JSON.parse(res.responseText))
        },
        failure: res => {
          reject({})
        }
      })
    })
  },

  onStateChange: async function (filter = {}) {
    // no do
    if (filter.filters.length === 0) {
      return this.renderState({
        error: false,
        content: '',
        stats: {}
      })
    }

    if (this._mask) {
      this._mask.show()
    }

    if (this._mask) {
      this._mask.show()
    }

    const state = {
      error: false,
      content: '',
      stats: {}
    }

    try {
      const [content, stats] = await Promise.all([
        this.fetchContent(filter),
        this.fetchStats(filter)
      ])

      state.content = content
      state.stats = stats
    } catch (error) {
      state.error = true
    }

    this.renderState(state)

    if (this._mask) {
      this._mask.hide()
    }
  },


  attachListeners: function () {
    let labels = []
    labels = document.querySelectorAll(`#${this.body.id} svg text`)

    for (let i = 0; i < labels.length; i++) {
      labels[i].addEventListener('click', this.onNodeClick.createDelegate(this))
    }
  },

  centerScrollPosition: function(container) {
    const scrollWidth = container.scrollWidth
    const scrollHeight = container.scrollHeight
    const viewportWidth = container.clientWidth
    const viewportHeight = container.clientHeight
    const scrollLeft = (scrollWidth - viewportWidth) / 2
    const scrollTop = (scrollHeight - viewportHeight) / 2
    container.scrollLeft = scrollLeft
    container.scrollTop = scrollTop
  },

  onNodeClick: function (e) {
    if (!e.ctrlKey) {
      return
    }

    this.state.filterState.filters.add({
      entity: 'Grave',
      attribute: 'key',
      operator: 'in',
      value: e.srcElement.innerHTML
    })
  },

  renderState: function (state) {
    if (!this._afterLayout) {
      return
    }

    let content = state.content
    let status = ''

    if (state.error) {
      status = 'Error'
    } else {
      status = Object.entries(state.stats)
        .map(([key, val]) => `${key}: ${val}`)
        .join(' ')
    }

    // TODO removeListeners before update
    this.update(content)
    this.Status.update(status)
    this.attachListeners()
    this.centerScrollPosition(this.body.dom)
  },

  onShowDOT: function () {
    const flt = this.state.filterState.filterObject
    const url = `/visualize/${flt.view.name}.dot?filter=${encodeURIComponent(
      JSON.stringify(flt)
    )}`
    X.util.download(url)
  },

  onShowSVG: function () {
    const flt = this.state.filterState.filterObject
    const url = `/visualize/${flt.view.name}.svg?filter=${encodeURIComponent(
      JSON.stringify(flt)
    )}`
    X.util.download(url)
  },

  onDownload: function (format) {
    const flt = this.state.filterState.filterObject
    const url = `/visualize/${
      flt.view.name
    }.${format}/download?filter=${encodeURIComponent(JSON.stringify(flt))}`
    X.util.download(url)
  },

  onResize: function (adjWidth, adjHeight, rawWidth, rawHeight) {
    X.View.superclass.onResize.apply(this, [
      adjWidth,
      adjHeight,
      rawWidth,
      rawHeight
    ])
    this._mask = new Ext.LoadMask(this.body, { msg: 'Loading ...' })
  }
})

Ext.reg('x-view', X.View)
