import { filter } from '../filter.mjs'
import { render } from '../render.mjs'
import { query } from '../query.mjs'
import { extractNodes } from '../transform.mjs'
import { groupBy, mapValues } from 'lodash-es'

const node_paths = ({ sqlite, neo4j, storage }) => {
  const getKeys = async flt => {
    const { conditions } = query({
      Grave: 'g',
      Item: 'i'
    })

    const items = await sqlite.all(`
      select
        g."key" as "node_key",
        i."id" as "item_key"
      from pd_grave g
        left join pd_item i on g.key = i.grave_key
      ${conditions(flt)}
    `)

    const nodeKeys = new Set()
    const itemKeys = new Set()
    for (const { node_key, item_key } of items) {
      if (node_key !== null) nodeKeys.add(node_key)
      if (item_key !== null) itemKeys.add(item_key)
    }

    return { nodes: [...nodeKeys], items: [...itemKeys] }
  }

  const getPaths = async (flt, keys) => {
    const { showEntity } = filter(flt)
    const inList = keys.map(k => `'${k}'`).join(',')

    let statement = `
      match paths=(n:Layer {key: 'T'})-[*]->(x)-[*]->(m:Layer {key: 'G'})
      where x.key in [${inList}]
      return distinct paths as r
    `

    if (showEntity('Item')) {
      statement = `
        match paths=(n:Layer {key: 'T'})-[*]->(x)-[*]->(m:Layer {key: 'G'})
        where x.key in [${inList}]
        with nodes(paths) as nodes, paths
        unwind nodes as n
        optional match paths_items=((n)-[r:CONTAINS]->(i:Item))
        with collect(paths) + collect(paths_items) as result
        unwind result as r
        return distinct r
      `
    }

    const items = await neo4j.exec(statement)
    return items.flatMap(i => i.get('r'))
  }

  const getStats = paths => {
    const nodes = extractNodes(paths)
    nodes.forEach(n => (n._label = n.labels[0]))
    const stats = mapValues(groupBy(nodes, '_label'), v => v.length)
    return { ...stats, Paths: paths.length }
  }

  const run = async flt => {
    const keys = await getKeys(flt)
    const paths = await getPaths(flt, keys.nodes)
    const stats = getStats(paths)

    return {
      keys,
      paths,
      stats
    }
  }

  const dot = async (data, flt) => {
    // prettier-ignore
    const {
      renderOrientation,
      renderPaths
    } = render(flt, data)

    return `
      digraph g {
        graph [
          compound = true
          fontsize = 10
          fontname = "Helvetica"
          layout = "dot"
          labeljust="l"
          rankdir = "${renderOrientation()}"
          newrank = true
        ];

        node [
          shape = "box"
          fontsize = 10
          fontname = "Helvetica"
          margin = 0.04
          width = 0.24
          height = 0.24
        ];

        edge [
          arrowhead="none"
          color="#000000"
          penwidth=0.5
          fontsize = 10
          fontname = "Helvetica"
        ];

        ${renderPaths(data.paths)}
      }
    `
  }

  return {
    name: 'node-paths',
    run,
    dot
  }
}

export { node_paths }
