import { v4 as uuid } from 'uuid'

const graph_path = () => {
  const addNode = (node, acc) => {
    if (acc.lookup.has(node.properties.key)) {
      return acc
    }

    acc.result.push(node)
    acc.lookup.add(node.properties.key)
    return acc
  }

  const countType = (path, type) => {
    const nodes = path.segments.reduce(
      (acc, curr) => {
        acc = addNode(curr.start, acc)
        acc = addNode(curr.end, acc)
        return acc
      },
      { result: [], lookup: new Set() }
    )

    return nodes.result.reduce((acc, curr) => {
      if (curr.labels.includes(type)) {
        acc = acc + 1
      }
      return acc
    }, 0)
  }

  const toPath = path => {
    const segments = path.segments.map(s => {
      const from = s.start.properties.key
      const to = s.end.properties.key
      return `${from}-${to}`
    })

    return segments.join('-')
  }

  const query = () => `
    match p=(n:Layer {key: 'T'})-[*]->(m:Layer {key: 'G'})
    return
      p,
      size(p) as p_size
  `

  const transform = row => {
    const path = row.get('p')
    const path_size = row.get('p_size').toNumber()

    const counts = {
      path_id: uuid(),
      path_size: path_size,
      path: toPath(path),
      count_node: path_size + 1,
      count_node_type_grave: countType(path, 'Grave'),
      count_node_type_label: countType(path, 'Label'),
      count_node_type_layer: countType(path, 'Layer'),
      count_node_type_su: countType(path, 'SU')
    }

    return counts
  }

  const mapping = {
    path_id: 'TEXT',
    path_size: 'INTEGER',
    path: 'TEXT',
    count_node: 'INTEGER',
    count_node_type_grave: 'INTEGER',
    count_node_type_label: 'INTEGER',
    count_node_type_layer: 'INTEGER',
    count_node_type_su: 'INTEGER'
  }

  return {
    name: 'g_graph_path',
    mapping,
    query,
    transform
  }
}

export { graph_path }
