const dqa_item_count = ({ sqlite }) => {
  const query = async () => {
    return sqlite.all(`
      select
        'pd_item' dqa_scope,
        'to review' dqa_status,
        id dqa_key,
        'Count >= 10' dqa_reason,
        id,
        type,
        subtype,
        internal_id,
        grave_key,
        count
      from pd_item where "count" >= 10
      order by grave_key asc
    `)
  }

  return {
    name: 'dqa-item-count',
    query
  }
}

export { dqa_item_count }
