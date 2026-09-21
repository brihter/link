Ext.ns('X')

X.Options = Ext.extend(Ext.form.FormPanel, {
  autoScroll: true,
  hideWhenEmpty: false,

  initComponent: function () {
    X.Options.superclass.initComponent.call(this)
    this._disposeState = mobx.autorun(() => this.updateState(this.resolveSections()))
    this.on('destroy', () => this._disposeState())
  },

  renderOptionGroups: function (section) {
    const store = section.store
    const state = mobx.toJS(store.values)
    const definitions = section.optionDefinitions || []
    const definitionIndexes = new Map(
      definitions.map((definition, index) => [definition.key, index])
    )

    const stateValues = Object.entries(state)
      .filter(([key]) => !section.filterOption || section.filterOption(key))
      .map(([key, val]) => {
        const definitionIndex = definitionIndexes.get(key)
        if (definitionIndex === undefined) {
          throw new Error(`Missing option definition: ${key}`)
        }
        const definition = definitions[definitionIndex]
        return {
          groupName: definition.group || '',
          optionOrder: definitionIndex,
          label: definition.label,
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

    const toCheckbox = option => ({
      xtype: 'checkbox',
      name: option.key,
      boxLabel: option.label,
      checked: option.val,
      listeners: {
        check: (_checkbox, checked) => (store.values[option.key] = checked)
      }
    })

    const options = _.sortBy(stateValues, 'optionOrder')
    const optionGroups = _.groupBy(options, 'groupName')
    return Object.entries(optionGroups).map(([groupName, groupOptions]) => ({
      ...toFieldset(groupName),
      items: groupOptions.map(toCheckbox)
    }))
  },

  renderOptions: function (sections) {
    const items = []
    for (const section of sections) {
      const fieldsets = this.renderOptionGroups(section)
      if (fieldsets.length === 0) {
        continue
      }
      if (section.title) {
        items.push({
          xtype: 'fieldset',
          title: section.title,
          autoHeight: true,
          border: false,
          style: 'padding: 0;',
          items: fieldsets
        })
      } else {
        items.push(...fieldsets)
      }
    }

    this.removeAll()
    items.forEach(item => this.add(item))
    if (this.hideWhenEmpty) {
      this.setVisible(items.length > 0)
    }
    if (items.length > 0) {
      this.doLayout()
    }
    if (this.ownerCt && this.ownerCt.rendered) {
      this.ownerCt.doLayout()
    }
  },

  updateState: function (sections) {
    this.renderOptions(sections)
  }
})

Ext.reg('x-options', X.Options)
