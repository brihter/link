const dqa_grave_item_subtype = ({ sqlite }) => {
  const query = async () => {
    return sqlite.all(`
      select
        pc."key",
        pc.catalog_name "cat_name",
        pc.catalog_page "cat_page",
        case when pg."key" is null then 'YES' else '-' end "missing",
        pi.internal_id "id",
        pi."type",
        pi.subtype
      from pd_catalog pc
        left join pd_grave pg on pg."key" = pc."key"
        left join pd_item pi on pi.grave_key = pg."key"
      order by
        pc.catalog_name asc,
        pc."key" asc
    `)
  }

  return {
    name: 'dqa-grave-item-subtype',
    query
  }
}

export { dqa_grave_item_subtype }
