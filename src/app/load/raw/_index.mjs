import { attr_position } from './attr_position.mjs'
import { attr_skeleton_arm_position } from './attr_skeleton_arm_position.mjs'
import { item } from './item.mjs'
import { item_xref_attr_position } from './item_xref_attr_position.mjs'
import { item_type } from './item_type.mjs'
import { grave } from './grave.mjs'
import { grave_xref_item } from './grave_xref_item.mjs'
import { grave_attr_gis } from './grave_attr_gis.mjs'
import { grave_attr_skeleton_arm_position } from './grave_attr_skeleton_arm_position.mjs'
import { grave_xref_grave } from './grave_xref_grave.mjs'
import { chrono_constraint } from './chrono_constraint.mjs'
// import { item_phase } from './item_phase.mjs'
// import { grave_chronology } from './grave_chronology.mjs'
// import { grave_chronology_trace } from './grave_chronology_trace.mjs'
// import { catalog } from './catalog.mjs'
import { phase } from './phase.mjs'
import { item_attr_material } from './item_attr_material.mjs'

const rawInput = ctx => {
  return [
    phase(ctx),
    attr_position(ctx),
    attr_skeleton_arm_position(ctx),
    grave(ctx),
    grave_attr_gis(ctx),
    grave_attr_skeleton_arm_position(ctx),
    item(ctx),
    // item_phase(ctx),
    item_xref_attr_position(ctx),
    item_type(ctx),
    grave_xref_item(ctx),
    grave_xref_grave(ctx),
    chrono_constraint(ctx),
    // grave_chronology(ctx),
    // grave_chronology_trace(ctx),
    // catalog(ctx),
    item_attr_material(ctx),
  ]
}

export { rawInput }
