Ext.ns('app_state')

app_state = () => {
  const defineOption = (key, label, value, group = '') => ({ key, label, value, group })
  const toOptionValues = definitions => Object.fromEntries(
    definitions.map(({ key, value }) => [key, value])
  )
  const defineView = (name, label, settingDefinitions = [], attributeDefinitions = []) => ({
    name,
    label,
    settings: toOptionValues(settingDefinitions),
    attributes: toOptionValues(attributeDefinitions),
    settingDefinitions,
    attributeDefinitions
  })

  const graphSettingDefinitions = [
    defineOption('graph.flip', 'Flip', false, 'Graph'),
    defineOption('graph.group.phase', 'Phase', false, 'Group By'),
    defineOption('graph.labels', 'Labels', true, 'Display'),
    defineOption('show.attributes', 'Attributes', true, 'Display'),
    defineOption('graph.highlight', 'Selected', true, 'Highlight'),
    defineOption('c14', 'C14', true, 'Highlight')
  ]
  const graphAttributeDefinitions = [
    defineOption('ts_to', 'TS To', true),
    defineOption('ts_from', 'TS From', true),
    defineOption('ts_length', 'TS Length', false),
    defineOption('ts_trace', 'TS Trace', false),
    defineOption('phase', 'Phase', false),
    defineOption('phase_source', 'Phase Source', false),
    defineOption('attr_depth_from', 'Depth From', false),
    defineOption('attr_depth_to', 'Depth To', false),
    defineOption('attr_azimuth', 'Azimuth', false),
    defineOption('attr_preservation', 'Preservation', false),
    defineOption('attr_skeleton_arm_code', 'Skeleton Arm Code', false),
    defineOption('attr_skeleton_arm_left', 'Skeleton Arm Left', false),
    defineOption('attr_skeleton_arm_right', 'Skeleton Arm Right', false)
  ]

  const tableSettingDefinitions = []
  const tableSettingKeys = new Set()
  for (const cube of app_data.cubes) {
    for (const column of cube.columns) {
      const key = `columns.${column.key}`
      if (!tableSettingKeys.has(key)) {
        tableSettingKeys.add(key)
        tableSettingDefinitions.push(defineOption(key, column.label, true, 'Columns'))
      }
    }
  }

  const views = [
    defineView('table', 'Table', tableSettingDefinitions),
    defineView('stratigraphy', 'Stratigraphy', graphSettingDefinitions, graphAttributeDefinitions),
    defineView('sequences', 'Sequences', graphSettingDefinitions, graphAttributeDefinitions)
  ]
  const filterState = new X.state.FilterState({
    stateManager: {
      selected: 1,
      visible: false
    },
    stateManagerStates: [],
    cube: {
      name: 'graves'
    },
    filters: {
      logic: 'and',
      filters: []
    },
    view: {
      name: 'table'
    },
    views
  })

  filterState.fetchStates()

  return {
    filterState,
    views
  }
}
