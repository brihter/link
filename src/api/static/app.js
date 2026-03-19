Ext.ns('app')

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
        width: 200,
        margins: '4px 4px 4px 0',
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
                      data: [
                        ['node', 'Node'],
                        ['node-paths', 'Node Paths']
                      ]
                    }),
                    valueField: 'type',
                    value: state.filterState.view.get('name'),
                    displayField: 'name',
                    listeners: {
                      select: (c, r, i) => {
                        state.filterState.view.set('name', r.data.type)
                      }
                    }
                  }
                ]
              }
            ]
          },
          {
            items: [
              {
                xtype: 'x-options',
                border: false,
                padding: '6px 8px',
                title: 'View Settings',
                state: state.filterState.viewSettings
              }
            ]
          },
          {
            margins: '0',
            items: [
              {
                xtype: 'x-options',
                border: false,
                padding: '6px 8px',
                title: 'View Attributes',
                state: state.filterState.viewAttributes
              }
            ]
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
