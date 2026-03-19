const dqa_item_subtype = ({ sqlite }) => {
  const query = async () => {
    return sqlite.all(`
      select
        'pd_item' dqa_scope,
        'to review' dqa_status,
        id dqa_key,
        'Podtip manjka' dqa_reason,
        id,
        type,
        subtype,
        internal_id,
        grave_key,
        notes
      from pd_item
      where subtype is null and notes like '%stara baza%'
      order by grave_key asc
    `)
  }

  return {
    name: 'dqa-item-subtype',
    query
  }
}

export { dqa_item_subtype }
