Ext.ns('X')

X.Filter = Ext.extend(Ext.form.FormPanel, {
  autoScroll: true,

  constructor: function (config) {
    X.Filter.superclass.constructor.apply(this, [config])
    mobx.autorun(() => this.updateState(this.state.filterState.filters))
  },

  renderFilters: function () {
    const toFilter = f => {
      return {
        xtype: 'container',
        layout: 'hbox',
        style: 'margin: 0 0 8px 0;',
        defaults: {
          hideLabel: true,
          flex: 1,
          margins: '0 4px 0 0'
        },
        items: [
          {
            xtype: 'combo',
            name: 'entity',
            emptyText: 'Entity',
            triggerAction: 'all',
            width: 70,
            mode: 'local',
            forceSelection: true,
            editable: false,
            store: new Ext.data.ArrayStore({
              id: 'type',
              fields: ['type', 'name'],
              data: app_data.entities
            }),
            valueField: 'type',
            value: f.entity,
            displayField: 'name',
            listeners: {
              select: (c, r, i) => {
                this.state.filterState.filters.update(f.id, {
                  entity: r.data.type,
                  attribute: 'key'
                })
              }
            }
          },
          {
            xtype: 'combo',
            name: 'attribute',
            emptyText: 'Attribute',
            triggerAction: 'all',
            width: 100,
            mode: 'local',
            forceSelection: true,
            editable: false,
            store: new Ext.data.ArrayStore({
              id: 'type',
              fields: ['entity', 'type', 'name'],
              data: app_data.attributes.filter(r => r[0] === f.entity)
            }),
            valueField: 'type',
            value: f.attribute,
            displayField: 'name',
            listeners: {
              select: (c, r, i) => {
                this.state.filterState.filters.update(f.id, {
                  attribute: r.data.type
                })
              }
            }
          },
          {
            xtype: 'combo',
            name: 'operator',
            triggerAction: 'all',
            emptyText: 'OP',
            width: 39,
            mode: 'local',
            forceSelection: true,
            editable: false,
            store: new Ext.data.ArrayStore({
              id: 'type',
              fields: ['type', 'name'],
              data: app_data.operators
            }),
            valueField: 'type',
            value: f.operator,
            displayField: 'name',
            listeners: {
              select: (c, r, i) => {
                this.state.filterState.filters.update(f.id, {
                  operator: r.data.type
                })
              }
            }
          },
          {
            xtype: 'textfield',
            name: 'value',
            value: f.value,
            enableKeyEvents: true,
            listeners: {
              change: (c, v) => {
                this.state.filterState.filters.update(f.id, { value: v })
              },
              keypress: (c, e) => {
                if (e.getKey() === e.ENTER) {
                  this.state.filterState.filters.update(f.id, {
                    value: c.getValue()
                  })
                }
              }
            }
          },
          {
            xtype: 'button',
            iconCls: 'icn_delete',
            width: 22,
            listeners: {
              click: () => {
                if (this.state.filterState.filters.values.length === 1) {
                  return
                }

                this.state.filterState.filters.remove(f.id)
              }
            }
          },
          {
            xtype: 'button',
            iconCls: 'icn_add',
            width: 22,
            margins: '0',
            listeners: {
              click: () => {
                this.state.filterState.filters.add({
                  entity: 'Grave',
                  attribute: 'key',
                  operator: 'in'
                })
              }
            }
          }
        ]
      }
    }

    const state = mobx.toJS(this.state.filterState.filters.values)

    let filters = []
    filters = state.map(toFilter)

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
            data: [
              [1, 'Grobišče Župna cerkev v Kranju']
            ]
          }),
          valueField: 'id',
          value: 1,
          displayField: 'name'
        }
      ]
    })

    this.add({
      xtype: 'fieldset',
      title: 'Filters',
      items: filters
    })

    this.doLayout()
  },

  updateState: function () {
    this.renderFilters()
  }
})

Ext.reg('x-filter', X.Filter)
