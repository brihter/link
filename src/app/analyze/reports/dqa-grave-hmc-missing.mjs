const dqa_grave_hmc_missing = ({ sqlite }) => {
  const query = async () => {
    return sqlite.all(`
      select distinct
        pc."key"
      from pd_catalog pc
        left join (
          select grave_from as "x" from etl_grave_xref_grave
            union
          select grave_to as "x" from etl_grave_xref_grave
        ) egxg on egxg."x" = pc."key"      
      where egxg."x" is null
      order by 1 asc
    `)
  }

  return {
    name: 'dqa-grave-hmc-missing',
    query
  }
}

export { dqa_grave_hmc_missing }
