const g_grave_phase_phasesource = ({ sqlite }) => {
  const query = async () => {
    return sqlite.all(`
      select
        phase,
        phase_source,
        count(*) as "count"
      from g_grave gg
      group by
        1, 2
      order by
        3 asc
    `)
  }

  return {
    name: 'g-grave-phase-phasesource',
    query
  }
}

export { g_grave_phase_phasesource }
