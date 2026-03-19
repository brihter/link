const pd_item = ctx => {
  const mapping = {
    id: 'INTEGER',
    type: 'TEXT',
    type_name: 'TEXT',
    subtype: 'TEXT',
    phase: 'TEXT',
    phase_source: 'TEXT',
    internal_id: 'TEXT',
    environment_id: 'TEXT',
    grave_key: 'TEXT',
    count: 'INTEGER',
    attr_coordinates: 'TEXT',
    attr_seen: 'INTEGER',
    attr_length: 'REAL',
    attr_width: 'REAL',
    attr_thickness: 'REAL',
    attr_weight: 'REAL',
    attr_material: 'TEXT',
    attr_position: 'TEXT',
    dt_from: 'DATE',
    dt_to: 'DATE',
    notes: 'TEXT',
  }

  const source = () => {
    return `
      select
        ei."id",
        ei."type",
        eit."description" "type_name",
        ei."subtype",
        null "phase",
        null "phase_source",
        ei."internal_id",
        ei."environment_id",
        eg."key" "grave_key",
        egxi."item_count" "count",
        ei."attr_coordinates",
        ei."attr_seen",
        ei."attr_length",
        ei."attr_width",
        ei."attr_thickness",
        ei."attr_weight",
        eiam."item_attr_material" attr_material,
        pip.item_positions attr_position,
        ei."dt_from",
        ei."dt_to",
        ei."notes"
      from etl_item ei
        left join etl_item_type eit on eit.type = ei.type
        left join etl_item_attr_material eiam on eiam.item_id = ei.id
        left join etl_grave_xref_item egxi on egxi.item_id = ei.id
          left join etl_grave eg on egxi.grave_id = eg.id
        left join pd_item_position pip on pip.item_id = ei.id
    `
  }

  return {
    name: 'pd_item',
    mapping,
    source
  }
}

export { pd_item }
