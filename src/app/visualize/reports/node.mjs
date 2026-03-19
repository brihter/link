import { filter } from '../filter.mjs'
import { render } from '../render.mjs'
import { query } from '../query.mjs'
import { extractNodes } from '../transform.mjs'
import { groupBy, mapValues, uniqBy } from 'lodash-es'

const node = ({ sqlite, neo4j }) => {
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

  const getNodes = async (flt, keys) => {
    const items = await neo4j.exec(`
      match (x) where x.key in [${keys.map(k => `'${k}'`).join(',')}]
      return x
    `)
    return items.flatMap(i => i.get('x')).filter(i => i !== null)
  }

  const getPaths = async (flt, keys) => {
    const { showEntity } = filter(flt)
    if (!showEntity('Item')) return []

    const items = await neo4j.exec(`
      match (x) where x.key in [${keys.map(k => `'${k}'`).join(',')}]
      optional match px=((x)-[r:CONTAINS]->(i:Item))
      return distinct px
    `)
    return items.flatMap(i => i.get('px')).filter(i => i !== null)
  }

  const getStats = (nodes, paths) => {
    const allNodes = uniqBy([...nodes, ...extractNodes(paths)], 'elementId')
    allNodes.forEach(n => (n._label = n.labels[0]))
    const stats = mapValues(groupBy(allNodes, '_label'), v => v.length)
    return { ...stats, Paths: paths.length }
  }

  const run = async flt => {
    const keys = await getKeys(flt)
    const [nodes, paths] = await Promise.all([
      getNodes(flt, keys.nodes),
      getPaths(flt, keys.nodes)
    ])
    const stats = getStats(nodes, paths)

    return {
      keys,
      nodes,
      paths,
      stats
    }
  }

  const dot = async (data, flt) => {
    // prettier-ignore
    const {
      renderOrientation,
      renderNodes,
      renderPaths
    } = render(flt, data)

    return `
      digraph g {
        graph [
          compound = true
          fontsize = 10
          fontname = "Helvetica"
          layout = "dot"
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
          color="#666666"
          penwidth=0.5
        ];

        ${renderNodes(data.nodes)}

        ${renderPaths(data.paths)}
      }
    `
  }

  return {
    name: 'node',
    run,
    dot
  }
}

export { node }
