Ext.ns('X.ui')

X.ui.StateManager = Ext.extend(Ext.Window, {
  modal: true,
  draggable: false,
  resizable: false,
  title: 'State',
  width: 640,
  height: 480,
  closeAction: 'hide',
  layout: 'fit',

  initComponent: function () {
    this._gridStore = new Ext.data.JsonStore({
      fields: [{ name: 'id' }, { name: 'name' }],
      data: []
    })

    this.items = [
      {
        xtype: 'grid',
        border: false,
        stripeRows: true,
        viewConfig: {
          forceFit: true,
          emptyText: 'No items ...',
          deferEmptyText: false,
          singleSelect: true
        },
        columns: [
          {
            header: 'Name',
            sortable: false,
            dataIndex: 'name'
          },
          {
            xtype: 'actioncolumn',
            sortable: false,
            align: 'center',
            width: 30,
            fixed: true,
            items: [
              {
                icon: '/res/icons/delete.png',
                handler: (grid, ix) => {
                  const rec = this._gridStore.getAt(ix)
                  const id = rec.data.id
                  if (id === 1) {
                    return
                  }

                  this.state.filterState.removeState(rec.data.id)
                }
              }
            ]
          }
        ],
        sm: new Ext.grid.RowSelectionModel({
          singleSelect: true
        }),
        store: this._gridStore
      }
    ]
    X.ui.StateManager.superclass.initComponent.call(this)

    this.on('hide', this.handleHide.createDelegate(this))

    mobx.autorun(() => this.updateState(this.state))
  },

  handleHide: function () {
    this.state.filterState.stateManager.set('visible', false)
  },

  updateState: function (state) {
    if (state.filterState.stateManager.values.visible) {
      this.show()
    } else {
      this.hide()
    }

    const items = mobx.toJS(this.state.filterState.stateManagerStates.values)
    this._gridStore.loadData(items)
  }
})

Ext.reg('x-state-mgr', X.ui.StateManager)
