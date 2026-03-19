const g_grave_path_stats = ({ sqlite }) => {
  const query = async () => {
    const data = await sqlite.all(`
      select
        ggp.count_node_type_grave,
        count(1) n
      from g_graph_path ggp
      group by
        1
      order by
        1 asc
    `)

    return data
  }

  return {
    name: 'g-grave-path-stats',
    query
  }
}

export { g_grave_path_stats }
