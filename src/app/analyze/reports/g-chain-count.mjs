const g_chain_count = ({ neo4j }) => {
  const query = async () => {
    const data = await neo4j.exec(`
      match path=(n:Layer {key: 'T'})-[*]->(m:Layer {key: 'G'})
      return
        count(*) as n
    `)
    return [{ n: data[0].get('n').toNumber() }]
  }

  return {
    name: 'g-chain-count',
    query
  }
}

export { g_chain_count }
