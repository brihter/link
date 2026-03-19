const dqa_item_attr_length = ({ sqlite }) => {
  const query = async () => {
    return sqlite.all(`
      select
        'pd_item' dqa_scope,
        'to review' dqa_status,
        id dqa_key,
        'Dolzina >= 100' dqa_reason,
        id,
        type,
        subtype,
        internal_id,
        grave_key,
        attr_length
      from pd_item where attr_length >= 100
      order by grave_key asc
    `)
  }

  return {
    name: 'dqa-item-attr-length',
    query
  }
}

export { dqa_item_attr_length }
