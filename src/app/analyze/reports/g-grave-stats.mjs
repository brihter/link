const g_grave_stats = ({ sqlite }) => {
  const queries = [
    {
      description: 'Number of graves',
      conditions: 'Phase=ZSV, Items>0',
      query: () => {
        return `
          select
            count(distinct gg."key") as "count"
          from g_grave gg
            left join pd_item pi on pi.grave_key = gg."key" 
          where 1=1
          and gg.phase = 'ZSV'
          and pi.id is not null
        `
      }
    },
    {
      description: 'Number of graves',
      conditions: 'Phase=ZSV, Items=0',
      query: () => {
        return `
          select
            count(distinct gg."key") as "count"
          from g_grave gg
            left join pd_item pi on pi.grave_key = gg."key" 
          where 1=1
          and gg.phase = 'ZSV'
          and pi.id is null
        `
      }
    }
  ]

  const toResult = (result, ix) => {
    return {
      description: queries[ix].description,
      conditions: queries[ix].conditions,
      value: result[0].count
    }
  }

  const query = async () => {
    let tasks = []
    tasks = queries.map(q => sqlite.all(q.query()))

    let results
    results = await Promise.all(tasks)
    results = results.map(toResult)

    return results
  }

  return {
    name: 'g-grave-stats',
    query
  }
}

export { g_grave_stats }
