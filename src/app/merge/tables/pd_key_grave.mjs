const pd_key_grave = ctx => {
  const mapping = {
    key: 'TEXT'
  }

  const source = () => {
    return `
      select
        k.key_new "key"
      from (
        select "key" as key_new from etl_grave
          union
        select "key" as key_new from etl_grave_attr_gis
          union
        select grave_from as key_new from etl_grave_xref_grave where grave_from not in ('T', 'G')
          union 
        select grave_to as key_new from etl_grave_xref_grave where grave_to not in ('T', 'G')
      ) k
    `
  }

  return {
    name: 'pd_key_grave',
    mapping,
    source
  }
}

export { pd_key_grave }
