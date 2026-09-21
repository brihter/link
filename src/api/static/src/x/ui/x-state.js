Ext.ns('X.ui')

X.ui.State = Ext.extend(Ext.form.FormPanel, {
  constructor: function (config) {
    this._comboStore = new Ext.data.JsonStore({
      idProperty: 'id',
      root: 'items',
      fields: ['id', 'name', 'state'],
      data: {
        items: []
      }
    })

    this.tools = [
      {
        id: 'save',
        handler: this.onSave.createDelegate(this)
      },
      {
        id: 'gear',
        handler: this.onEdit.createDelegate(this)
      }
    ]

    this.items = [
      {
        xtype: 'combo',
        ref: 'State',
        name: 'view',
        anchor: '100%',
        triggerAction: 'all',
        mode: 'local',
        hideLabel: true,
        forceSelection: true,
        editable: false,
        store: this._comboStore,
        valueField: 'id',
        value: 1,
        displayField: 'name',
        listeners: {
          select: (c, r, i) => {
            this.state.filterState.stateManager.set('selected', r.data.id)
          }
        }
      }
    ]

    X.ui.State.superclass.constructor.apply(this, [config])

    mobx.autorun(() => this.updateState(this.state))
  },

  onEdit: function () {
    this.state.filterState.stateManager.set('visible', true)
  },

  onSave: function () {
    Ext.MessageBox.prompt('State name', null, async (action, name) => {
      if (action !== 'ok' || name.length === 0) {
        return
      }

      const params = {
        scope: 'visualize',
        name,
        state: this.state.filterState.serialize()
      }

      await this.state.filterState.saveState(params)
    })
  },

  updateState: function () {
    const state = this.state.filterState

    // set combo data
    const states = state.stateManagerStates.values
    this._comboStore.loadData({ items: mobx.toJS(states) })

    // select combo by id
    const selectedStateId = state.stateManager.get('selected')
    this.State.setValue(selectedStateId)
    this.State.collapse()

    // filterState load by select id state
    const selectedState = state.stateManagerStates.get(selectedStateId)
    if (!selectedState) {
      return
    }

    mobx.untracked(() => state.load(selectedState.state))
  }
})

Ext.reg('x-state', X.ui.State)
