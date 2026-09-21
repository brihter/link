import { render, noticeResult, renderNotice, STRATIGRAPHIC_RELATIONSHIPS } from '../render.mjs'
import { extractNodes } from '../transform.mjs'
import { countBy } from 'lodash-es'

const recordsToPaths = records => records.map(record => record.get('r')).filter(path => path !== null)

const uniqueNodeKeys = paths => {
  return extractNodes(paths)
    .map(node => node.properties.key)
    .filter(key => key !== undefined)
}

const stratigraphy = ({ neo4j }, cubes) => {
  const getKeys = async filter => {
    return { nodes: await cubes.keys(filter) }
  }

  const getVerticalPaths = async keys => {
    if (keys.length === 0) return []

    const relationshipTypes = STRATIGRAPHIC_RELATIONSHIPS.vertical.join('|')
    const records = await neo4j.exec(
      `
        match paths=(top:Layer {key: 'T'})-[:${relationshipTypes}*]->(x)-[:${relationshipTypes}*]->(
          bottom:Layer {key: 'G'}
        )
        where x.key in $keys
        return distinct paths as r
      `,
      { keys }
    )

    return recordsToPaths(records)
  }

  const getContextPaths = async keys => {
    if (keys.length === 0) return []

    const relationshipTypes = STRATIGRAPHIC_RELATIONSHIPS.context.join('|')
    const records = await neo4j.exec(
      `
        match context=(node)-[:${relationshipTypes}]->(peer)
        where (node.key in $keys or peer.key in $keys)
          and (node:Grave or node:SU)
          and (peer:Grave or peer:SU)
        return distinct context as r
      `,
      { keys }
    )

    return recordsToPaths(records)
  }

  const getStats = (paths, pathCount) => {
    const nodes = extractNodes(paths)
    const stats = countBy(nodes, node => node.labels[0])
    return { ...stats, Paths: pathCount }
  }

  const run = async flt => {
    const keys = await getKeys(flt)
    const verticalPaths = await getVerticalPaths(keys.nodes)

    if (verticalPaths.length === 0) {
      return noticeResult(
        keys,
        'No stratigraphic network',
        'No connected stratigraphic path matches the current filter.',
        { Grave: 0, SU: 0, Paths: 0 }
      )
    }

    const contextPaths = await getContextPaths(uniqueNodeKeys(verticalPaths))
    const paths = [...verticalPaths, ...contextPaths]

    return {
      keys,
      paths,
      stats: getStats(paths, verticalPaths.length)
    }
  }

  const dot = async (data, flt) => {
    if (data.notice) return renderNotice(data.notice, flt)

    const stratigraphyFilter = {
      ...flt,
      viewSettings: {
        ...(flt.viewSettings || {}),
        'graph.connect': true
      },
      viewAttributes: flt.viewAttributes || {}
    }

    const { renderOrientation, renderPaths } = render(stratigraphyFilter, data)
    const labelRankSeparation = flt.viewSettings['graph.labels'] ? 'ranksep = 0.3' : ''

    return `
      digraph g {
        graph [
          compound = true
          fontsize = 10
          fontname = "Helvetica"
          layout = "dot"
          labeljust="l"
          rankdir = "${renderOrientation()}"
          ${labelRankSeparation}
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

        ${renderPaths(data.paths, { inlineRelationshipLabels: true })}
      }
    `
  }

  return {
    name: 'stratigraphy',
    run,
    dot
  }
}

export { stratigraphy }
