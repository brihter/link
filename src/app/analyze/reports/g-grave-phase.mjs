const g_grave_phase = ({ sqlite }) => {
  const query = async () => {
    return sqlite.all(`
      select
        phase,
        count(*) as "count"
      from g_grave gg
      group by
        1
      order by
        2 asc
    `)
  }

  return {
    name: 'g-grave-phase',
    query
  }
}

export { g_grave_phase }
