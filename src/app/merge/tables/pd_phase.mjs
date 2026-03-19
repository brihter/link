const pd_phase = ctx => {
  const mapping = {
    phase: 'TEXT',
    phase_from: 'INTEGER',
    phase_to: 'INTEGER',
  }

  const source = () => {
    return `
      select
        ep.phase,
        ep.phase_from,
        ep.phase_to
      from etl_phase ep
    `
  }

  return {
    name: 'pd_phase',
    mapping,
    source
  }
}

export { pd_phase }
