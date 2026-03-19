const pd_grave = ctx => {
  const mapping = {
    key: 'TEXT',
    type: 'TEXT',
    ts_from: 'INTEGER',
    ts_to: 'INTEGER',
    ts_length: 'INTEGER',
    phase: 'TEXT',
    phase_source: 'TEXT',
    attr_coordinates: 'TEXT',
    attr_deceased: 'INTEGER',
    attr_length: 'REAL',
    attr_width: 'REAL',
    attr_depth_from: 'REAL',
    attr_depth_to: 'REAL',
    attr_deflation_from_north: 'INTEGER',
    attr_body_gender: 'TEXT',
    attr_body_age_min: 'REAL',
    attr_body_age_max: 'REAL',
    attr_preservation: 'INTEGER',
    attr_x: 'REAL',
    attr_y: 'REAL',
    attr_z: 'REAL',
    attr_azimuth: 'INTEGER',
    attr_other: 'TEXT',
    attr_skeleton_arm_code: 'TEXT',
    attr_skeleton_arm_left_code: 'INTEGER',
    attr_skeleton_arm_left: 'TEXT',
    attr_skeleton_arm_right_code: 'INTEGER',
    attr_skeleton_arm_right: 'TEXT',
    notes: 'TEXT',
    source: 'TEXT'
  }

  const source = () => {
    return `
      select
        k."key",
        eg."type",
        egc.ts_from,
        egc.ts_to,
        egc.ts_length,
        null "phase",
        null "phase_source",
        eg."attr_coordinates",
        eg."attr_deceased",
        eg."attr_length",
        eg."attr_width",
        eg."attr_depth_from",
        eg."attr_depth_to",
        eg."attr_deflation_from_north",
        eg."attr_body_gender",
        eg."attr_body_age_min",
        eg."attr_body_age_max",
        egag."attr_preservation",
        egag."attr_loc_x" "attr_x",
        egag."attr_loc_y" "attr_y",
        egag."attr_loc_z" "attr_z",
        egag."attr_loc_azimuth" "attr_azimuth",
        egag."attr_loc_other" "attr_other",
        case when egasap.arm_position_code is null then '99' else egasap.arm_position_code end "attr_skeleton_arm_code",
        case when egasap.arm_position_type_left is null then '9' else egasap.arm_position_type_left end "attr_skeleton_arm_left_code",
        case when easap1.description is null then 'N/A' else easap1.description end "attr_skeleton_arm_left",
        case when egasap.arm_position_type_right is null then '9' else egasap.arm_position_type_right end "attr_skeleton_arm_right_code",
        case when easap2.description is null then 'N/A' else easap2.description end "attr_skeleton_arm_right",
        eg."notes",
        egag."source"
      from pd_key_grave k
        left join etl_grave_chronology egc on egc."key" = k."key"
        left join etl_grave eg on k."key" = eg."key"
        left join etl_grave_attr_gis egag on k."key" = egag."key"
        left join etl_grave_attr_skeleton_arm_position egasap on egasap."key" = k."key"
          left join etl_attr_skeleton_arm_position easap1 on easap1."type" = egasap.arm_position_type_left
          left join etl_attr_skeleton_arm_position easap2 on easap2."type" = egasap.arm_position_type_right
    `
  }

  return {
    name: 'pd_grave',
    mapping,
    source
  }
}

export { pd_grave }
