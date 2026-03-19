const grave = () => {
  const query = () => `
    match (g:Grave)
    return
      g.key,
      g.phase,
      g.phase_source
  `

  const transform = record => {
    return {
      key: record.get('g.key'),
      phase: record.get('g.phase'),
      phase_source: record.get('g.phase_source')
    }
  }

  const mapping = {
    key: 'TEXT',
    phase: 'TEXT',
    phase_source: 'TEXT'
  }

  return {
    name: 'g_grave',
    mapping,
    query,
    transform
  }
}

export { grave }
