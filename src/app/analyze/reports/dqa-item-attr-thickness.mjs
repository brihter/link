const dqa_item_attr_thickness = ({ sqlite }) => {
  const query = async () => {
    return sqlite.all(`
      select
        'pd_item' dqa_scope,
        'to review' dqa_status,
        id dqa_key,
        'Debelina >= 10' dqa_reason,
        id,
        type,
        subtype,
        internal_id,
        grave_key,
        attr_thickness
      from pd_item where attr_thickness >= 10
      order by grave_key asc
    `)
  }

  return {
    name: 'dqa-item-attr-thickness',
    query
  }
}

export { dqa_item_attr_thickness }
