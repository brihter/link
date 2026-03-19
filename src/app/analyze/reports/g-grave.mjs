const g_grave = ({ sqlite }) => {
  const query = async () => {
    return sqlite.all(`
      select count(*) as "count" from g_grave
    `)
  }

  return {
    name: 'g-grave',
    query
  }
}

export { g_grave }
