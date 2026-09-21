Ext.ns('app')
const borderWidthStyles = {
  b: 'border-bottom-width',
  l: 'border-left-width',
  r: 'border-right-width',
  t: 'border-top-width'
}

// ext 3 truncates fractional border widths and breaks layouts at non-integer display scales
Ext.Element.addMethods({
  getBorderWidth: function (sides) {
    let totalWidth = 0

    for (let index = 0; index < sides.length; index += 1) {
      const style = borderWidthStyles[sides[index]]
      const width = style ? parseFloat(this.getStyle(style)) : 0
      totalWidth += width ? Math.abs(width) : 0
    }

    return totalWidth
  }
})


app = state => {

  new Ext.Viewport({
    renderTo: Ext.getBody(),
    layout: 'border',
    defaults: {
      border: true
    },
    items: [
      {
        xtype: 'container',
        region: 'north',
        html: `
          <div class="header-inner">
            <img src="res/img/ioa.svg" alt="IOA" style="height:30px;width:auto;">
            <div>
              <strong>Link</strong> <br />
              Stratigraphic Analysis, v0.2.0 (c) ZRC SAZU, Institute of Archaeology
            </div>
          </div>
        `,
        cls: 'header',
        margins: '6px 0 0 8px',
        height: 30
      },
      {
        xtype: 'container',
        region: 'west',
        width: 400,
        margins: '4px 0 4px 4px',
        layout: {
          type: 'vbox',
          align: 'stretch'
        },
        defaults: {
          xtype: 'panel',
          layout: 'accordion',
          layoutConfig: {
            hideCollapseTool: true,
            titleCollapse: false
          },
          flex: 3,
          margins: '0 0 4px 0'
        },
        items: [
          {
            height: 63,
            items: [
              {
                xtype: 'x-state',
                title: 'State',
                border: false,
                padding: '8px',
                state
              }
            ]
          },
          {
            margins: '0',
            items: [
              {
                xtype: 'x-filter',
                border: false,
                labelWidth: 50,
                padding: '8px',
                title: 'Filter',
                state
              }
            ]
          }
        ]
      },
      {
        xtype: 'container',
        region: 'east',
        width: 240,
        margins: '4px 4px 4px 0',
        layout: {
          type: 'vbox',
          align: 'stretch'
        },
        items: [
          {
            xtype: 'panel',
            height: 63,
            layout: 'accordion',
            layoutConfig: {
              hideCollapseTool: true,
              titleCollapse: false
            },
            margins: '0 0 4px 0',
            items: [
              {
                xtype: 'form',
                title: 'View',
                border: false,
                padding: '8px',
                items: [
                  {
                    xtype: 'combo',
                    name: 'view',
                    anchor: '100%',
                    triggerAction: 'all',
                    mode: 'local',
                    hideLabel: true,
                    forceSelection: true,
                    editable: false,
                    store: new Ext.data.ArrayStore({
                      id: 'type',
                      fields: ['type', 'name'],
                      data: state.views.map(view => [view.name, view.label])
                    }),
                    valueField: 'type',
                    value: state.filterState.view.get('name'),
                    displayField: 'name',
                    listeners: {
                      afterrender: combo => {
                        const dispose = mobx.autorun(() => {
                          combo.setValue(state.filterState.view.get('name'))
                        })
                        combo.on('destroy', dispose)
                      },
                      select: (_combo, record) => {
                        state.filterState.view.set('name', record.data.type)
                      }
                    }
                  }
                ]
              }
            ]
          },
          {
            xtype: 'x-options',
            border: true,
            flex: 3,
            hideWhenEmpty: true,
            layout: 'form',
            margins: '0',
            padding: '6px 8px',
            title: 'View Settings',
            resolveSections: () => {
              const viewName = state.filterState.view.get('name')
              const view = state.views.find(candidate => candidate.name === viewName)
              const settingDefinitions = viewName === 'table'
                ? app_data.getCube(state.filterState.cube.get('name')).columns.map(column => ({
                  key: `columns.${column.key}`,
                  label: column.label,
                  group: 'Columns'
                }))
                : view.settingDefinitions
              const settingKeys = new Set(settingDefinitions.map(definition => definition.key))
              return [
                {
                  store: state.filterState.viewSettings,
                  optionDefinitions: settingDefinitions,
                  filterOption: key => settingKeys.has(key)
                },
                {
                  title: 'Attributes',
                  store: state.filterState.viewAttributes,
                  optionDefinitions: view.attributeDefinitions
                }
              ]
            }
          }
        ]
      },
      {
        xtype: 'x-view',
        region: 'center',
        margins: '4px',
        state
      },
      {
        xtype: 'container',
        region: 'south',
        cls: 'footer',
        margins: '0 8px 6px 8px',
        height: 30,
        html: `
          <footer class="funding">
            <a href="https://www.aris-rs.si/" target="_blank" rel="noopener">
              <img src="res/img/aris.svg" alt="Slovenian Research and Innovation Agency (ARIS)" style="height:30px;width:auto;">
            </a>
            <p>
              This project was funded by the Slovenian Research and Innovation Agency (ARIS), project no. SRI-2503 RSF.
            </p>
          </footer>
        `
      }
    ]
  })

  new X.ui.StateManager({ state })
}
