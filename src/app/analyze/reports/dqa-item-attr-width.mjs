const dqa_item_attr_width = ({ sqlite }) => {
  const query = async () => {
    return sqlite.all(`
      select
        'pd_item' dqa_scope,
        'to review' dqa_status,
        id dqa_key,
        'Sirina >= 50' dqa_reason,
        id,
        type,
        subtype,
        internal_id,
        grave_key,
        attr_width
      from pd_item where attr_width >= 50
      order by grave_key asc
    `)
  }

  return {
    name: 'dqa-item-attr-width',
    query
  }
}

export { dqa_item_attr_width }
