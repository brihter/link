const pd_item_positions = ctx => {
  const mapping = {
    item_id: 'INTEGER',
    item_positions: 'TEXT'
  }

  const source = () => {
    return `
      select
        ei.id item_id,
        group_concat(eap.description, ', ') item_positions
      from etl_item ei
        left join etl_item_xref_attr_position eixap on eixap.item_id = ei.id
          left join etl_attr_position eap on eap."type" = eixap.position_type 
      where 1=1
      and eap."type" is not null
      group by
        ei.id
    `
  }

  return {
    name: 'pd_item_position',
    mapping,
    source
  }
}

export { pd_item_positions }
