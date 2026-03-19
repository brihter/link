Ext.ns('X')

X.Options = Ext.extend(Ext.form.FormPanel, {
  autoScroll: true,

  initComponent: function () {
    X.Options.superclass.initComponent.call(this)
    mobx.autorun(() => this.updateState(this.state))
  },

  renderOptions: function (store) {
    const state = mobx.toJS(store.values)

    const stateValues = Object.entries(state).map(([key, val]) => {
      const [keyName, valName] = key.split('.')
      return {
        keyName: _.capitalize(keyName),
        valName: valName
          .replace('attr_', '')
          .replace('item_', '')
          .split('_')
          .map(v => _.capitalize(v))
          .join(' '),
        key,
        val
      }
    })

    const toFieldset = groupName => ({
      xtype: 'fieldset',
      title: groupName,
      autoHeight: true,
      border: false,
      style: 'padding: 0;',
      defaults: {
        hideLabel: true
      },
      items: []
    })

    const toCheckbox = o => {
      return {
        xtype: 'checkbox',
        name: o.key,
        boxLabel: o.valName,
        checked: o.val,
        listeners: {
          check: (c, checked) => (store.values[o.key] = checked)
        }
      }
    }

    let checkboxes = []
    checkboxes = stateValues.map(toCheckbox)
    checkboxes = _.sortBy(checkboxes, 'boxLabel')

    let fieldsets = []
    fieldsets = _.groupBy(stateValues, 'keyName')
    fieldsets = Object.keys(fieldsets)
    fieldsets = fieldsets.map(toFieldset)
    fieldsets = fieldsets.map(g => {
      const prefix = g.title.toLowerCase()
      const matches = checkboxes.filter(gv => _.startsWith(gv.name, prefix))
      g.items = matches
      return g
    })

    this.removeAll()
    fieldsets.forEach(o => this.add(o))
    this.doLayout()
  },

  updateState: function (store) {
    this.renderOptions(store)
  }
})

Ext.reg('x-options', X.Options)
