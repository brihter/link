Ext.ns('app_state')

app_state = () => {
  const filterState = new X.state.FilterState({
    stateManager: {
      selected: 1,
      visible: false
    },
    stateManagerStates: [],
    filters: [
      {
        id: 1,
        entity: 'Grave',
        attribute: 'key',
        operator: 'in'
      }
    ],
    view: {
      name: 'node-paths'
    },
    viewSettings: {
      'entities.item': false,
      'graph.highlight': true,
      'graph.flip': false,
      'graph.connect': true,
      'graph.labels': false,
      'show.attributes': true
    },
    viewAttributes: {
      'su.ts_to': true,
      'su.ts_from': true,
      'su.ts_length': false,
      'su.ts_trace': false,
      'su.phase': false,
      'su.phase_source': false,
      'grave.ts_to': true,
      'grave.ts_from': true,
      'grave.ts_length': false,
      'grave.ts_trace': false,
      'grave.attr_depth_from': false,
      'grave.attr_depth_to': false,
      'grave.attr_azimuth': false,
      'grave.attr_preservation': false,
      'grave.attr_skeleton_arm_code': false,
      'grave.attr_skeleton_arm_left': false,
      'grave.attr_skeleton_arm_right': false,
      'grave.phase': false,
      'grave.phase_source': false,
      'item.key': false,
      'item.type': true,
      'item.type_name': false,
      'item.subtype': true,
      'item.phase': true,
      'item.item_count': false,
      'item.item_positions': false,
      'item.internal_id': true,
      'item.attr_weight': false,
      'item.attr_width': false,
      'item.attr_thickness': false,
      'item.attr_seen': false,
      'item.attr_length': false
    }
  })

  filterState.fetchStates()

  return {
    filterState
  }
}
