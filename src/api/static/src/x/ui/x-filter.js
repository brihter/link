Ext.ns('X')

X.Filter = Ext.extend(Ext.form.FormPanel, {
  autoScroll: true,

  constructor: function (config) {
    config = Ext.apply({}, config)
    config.bbar = {
      xtype: 'toolbar',
      cls: 'filter-bbar-help',
      height: 27,
      items: [
        {
          xtype: 'label',
          cls: 'filter-help',
          html: '<strong>%</strong> matches zero or more characters with <strong>LIKE</strong>.'
        }
      ]
    }

    X.Filter.superclass.constructor.apply(this, [config])
    this._disposeState = mobx.autorun(() => {
      this.state.filterState.cube.get('name')
      mobx.toJS(this.state.filterState.filters)
      this.updateState()
    })
    this.on(
      'destroy',
      function () {
        this._disposeState()
      },
      this
    )
  },

  getCube: function () {
    return app_data.getCube(this.state.filterState.cube.get('name'))
  },

  getFilterDefinition: function (cube, filter) {
    return cube.filters.find(definition => definition.attribute === filter.attribute)
  },

  getDefaultFilter: function (cube) {
    const definition = cube.filters[0]
    return {
      attribute: definition.attribute,
      operator: definition.operators[0],
      value: ''
    }
  },

  getOperatorLabel: function (operator) {
    const labels = {
      in: 'is',
      'not in': 'is not',
      like: 'matches',
      'not like': 'not match'
    }
    return labels[operator] || operator
  },

  renderCondition: function (cube, group, filter) {
    const definition = this.getFilterDefinition(cube, filter)
    const operators = definition ? definition.operators : []
    const attributes = cube.filters.map(item => [
      item.attribute,
      item.label
    ])

    return {
      xtype: 'container',
      cls: 'filter-condition',
      layout: 'hbox',
      anchor: '100%',
      defaults: {
        hideLabel: true,
        margins: '0 4px 0 0'
      },
      items: [
        {
          xtype: 'combo',
          name: 'attribute',
          emptyText: 'Attribute',
          triggerAction: 'all',
          mode: 'local',
          forceSelection: true,
          editable: false,
          flex: 3,
          margins: '0 4px 0 3px',
          store: new Ext.data.ArrayStore({
            id: 'attribute',
            fields: ['attribute', 'label'],
            data: attributes
          }),
          valueField: 'attribute',
          value: filter.attribute,
          displayField: 'label',
          listeners: {
            select: (combo, record) => {
              this.state.filterState.updateFilter(filter.id, {
                attribute: record.data.attribute
              })
            }
          }
        },
        {
          xtype: 'combo',
          name: 'operator',
          triggerAction: 'all',
          emptyText: 'Operator',
          width: 72,
          mode: 'local',
          forceSelection: true,
          editable: false,
          store: new Ext.data.ArrayStore({
            id: 'operator',
            fields: ['operator', 'label'],
            data: operators.map(operator => [operator, this.getOperatorLabel(operator)])
          }),
          valueField: 'operator',
          value: filter.operator,
          displayField: 'label',
          listeners: {
            select: (combo, record) => {
              this.state.filterState.updateFilter(filter.id, {
                operator: record.data.operator
              })
            }
          }
        },
        {
          xtype: 'textfield',
          name: 'value',
          emptyText: 'Value',
          value: filter.value,
          enableKeyEvents: true,
          flex: 2,
          listeners: {
            change: (component, value) => {
              this.state.filterState.updateFilter(filter.id, { value })
            },
            keypress: (component, event) => {
              if (event.getKey() === event.ENTER) {
                this.state.filterState.updateFilter(filter.id, {
                  value: component.getValue()
                })
              }
            }
          }
        },
        {
          xtype: 'button',
          iconCls: 'icn_delete',
          tooltip: 'Remove condition',
          width: 22,
          margins: '0 2px',
          listeners: {
            click: () => {
              this.state.filterState.removeFilter(filter.id)
            }
          }
        },
        {
          xtype: 'button',
          iconCls: 'icn_add',
          tooltip: 'Add condition',
          width: 22,
          margins: '0 3px 0 2px',
          listeners: {
            click: () => {
              this.state.filterState.addFilter(group.id, this.getDefaultFilter(cube))
            }
          }
        }
      ]
    }
  },

  renderGroup: function (cube, group, isRoot = false) {
    const filters = group.filters || []
    const items = [
      {
        xtype: 'container',
        cls: 'filter-group-header',
        layout: 'hbox',
        items: [
          {
            xtype: 'label',
            cls: 'filter-group-label',
            text: 'Match',
            width: 38,
            margins: '0 4px 0 5px'
          },
          {
            xtype: 'combo',
            name: 'logic',
            triggerAction: 'all',
            mode: 'local',
            forceSelection: true,
            editable: false,
            width: 84,
            margins: '4px 4px 4px 0',
            store: new Ext.data.ArrayStore({
              id: 'logic',
              fields: ['logic', 'label'],
              data: [
                ['and', 'all (AND)'],
                ['or', 'any (OR)']
              ]
            }),
            valueField: 'logic',
            value: group.logic,
            displayField: 'label',
            listeners: {
              select: (combo, record) => {
                this.state.filterState.updateFilter(group.id, {
                  logic: record.data.logic
                })
              }
            }
          },
          {
            xtype: 'label',
            cls: 'filter-group-label',
            text: 'of these',
            width: 44,
            margins: '0 4px 0 0'
          },
          {
            xtype: 'container',
            flex: 1
          },
          ...(!isRoot
            ? [
                {
                  xtype: 'button',
                  iconCls: 'icn_delete',
                  tooltip: 'Remove group',
                  width: 22,
                  margins: '4px 2px',
                  listeners: {
                    click: () => {
                      this.state.filterState.removeFilter(group.id)
                    }
                  }
                }
              ]
            : []),
          {
            xtype: 'button',
            iconCls: 'icn_add',
            tooltip: 'Add group',
            width: 22,
            margins: '4px 2px',
            listeners: {
              click: () => {
                this.state.filterState.addFilterGroup(group.id, this.getDefaultFilter(cube))
              }
            }
          }
        ]
      }
    ]

    if (filters.length === 0) {
      items.push({
        xtype: 'container',
        cls: 'filter-empty',
        layout: 'hbox',
        items: [
          {
            xtype: 'container',
            cls: 'filter-empty-message',
            html: 'No conditions in this group.',
            flex: 1
          },
          {
            xtype: 'button',
            iconCls: 'icn_add',
            tooltip: 'Add condition',
            width: 22,
            margins: '0 3px 0 2px',
            listeners: {
              click: () => {
                this.state.filterState.addFilter(group.id, this.getDefaultFilter(cube))
              }
            }
          }
        ]
      })
    }

    filters.forEach(filter => {
      items.push(
        Array.isArray(filter.filters)
          ? this.renderGroup(cube, filter)
          : this.renderCondition(cube, group, filter)
      )
    })


    return {
      xtype: 'container',
      cls: isRoot ? 'filter-group filter-group-root' : 'filter-group',
      anchor: '100%',
      items
    }
  },

  renderFilters: function () {
    const cube = this.getCube()
    if (!cube) {
      return
    }

    const filters = mobx.toJS(this.state.filterState.filters)
    this.removeAll()

    this.add({
      xtype: 'fieldset',
      title: 'Site',
      items: [
        {
          xtype: 'combo',
          name: 'site',
          fieldLabel: 'Site',
          hideLabel: true,
          anchor: '100%',
          triggerAction: 'all',
          mode: 'local',
          forceSelection: true,
          editable: false,
          store: new Ext.data.ArrayStore({
            id: 'id',
            fields: ['id', 'name'],
            data: [[1, 'Grobišče Župna cerkev v Kranju']]
          }),
          valueField: 'id',
          value: 1,
          displayField: 'name'
        }
      ]
    })

    this.add({
      xtype: 'fieldset',
      title: 'Cubes',
      items: [
        {
          xtype: 'combo',
          name: 'cube',
          hideLabel: true,
          anchor: '100%',
          triggerAction: 'all',
          mode: 'local',
          forceSelection: true,
          editable: false,
          store: new Ext.data.ArrayStore({
            id: 'name',
            fields: ['name', 'label'],
            data: app_data.cubes.map(item => [item.name, item.label])
          }),
          valueField: 'name',
          value: cube.name,
          displayField: 'label',
          listeners: {
            select: (combo, record) => {
              const nextCube = app_data.getCube(record.data.name)
              mobx.transaction(() => {
                this.state.filterState.cube.set('name', nextCube.name)
                this.state.filterState.clearFilters()
              })
            }
          }
        }
      ]
    })

    this.add({
      xtype: 'fieldset',
      title: 'Filters',
      items: [this.renderGroup(cube, filters, true)]
    })

    this.doLayout()
  },

  updateState: function () {
    this.renderFilters()
  }
})

Ext.reg('x-filter', X.Filter)
