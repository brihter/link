import { createHash } from 'node:crypto'
import { render, noticeResult, renderNotice, STRATIGRAPHIC_RELATIONSHIPS } from '../render.mjs'
import { extractNodes } from '../transform.mjs'
import { countBy } from 'lodash-es'

const SENTINEL_KEYS = new Set(['T', 'G'])

const getNodeSignature = node => {
  const labels = [...node.labels].sort().join('&')
  return `${labels}:${node.properties.key}`
}

const getPathMetadata = path => {
  if (path.segments.length === 0) return { length: 0, order: '', path, signature: '' }

  const start = path.segments[0].start
  const startSignature = getNodeSignature(start)
  const signatureParts = [startSignature]
  const orderParts = [startSignature]
  let length = SENTINEL_KEYS.has(start.properties.key) ? 0 : 1

  for (const segment of path.segments) {
    const endSignature = getNodeSignature(segment.end)
    signatureParts.push(segment.relationship.type, endSignature)
    orderParts.push(endSignature)
    if (!SENTINEL_KEYS.has(segment.end.properties.key)) length++
  }

  return {
    length,
    order: orderParts.join('|'),
    path,
    signature: signatureParts.join('|')
  }
}


const toSequences = paths => {
  const sequencesBySignature = new Map()
  for (const path of paths) {
    const sequence = getPathMetadata(path)
    if (!sequencesBySignature.has(sequence.signature)) {
      sequencesBySignature.set(sequence.signature, sequence)
    }
  }

  return [...sequencesBySignature.values()]
    .sort((left, right) => {
      return (
        right.length - left.length ||
        left.order.localeCompare(right.order) ||
        left.signature.localeCompare(right.signature)
      )
    })
    .map(({ length, signature, path }) => {
      const digest = createHash('sha256').update(signature).digest('hex')
      const unit = length === 1 ? 'node' : 'nodes'
      return {
        id: `sequence-${digest}`,
        label: `Sequence ${digest.slice(0, 8)} (${length} ${unit})`,
        length,
        path
      }
    })
}

const sequences = ({ neo4j }, cubes) => {
  const getKeys = async filter => {
    return { nodes: await cubes.keys(filter) }
  }

  const getPaths = async keys => {
    if (keys.length === 0) return []

    const relationshipTypes = [
      ...STRATIGRAPHIC_RELATIONSHIPS.vertical,
      ...STRATIGRAPHIC_RELATIONSHIPS.context
    ].join('|')
    const records = await neo4j.exec(
      `
        match path=(top:Layer {key: 'T'})-[:${relationshipTypes}*]->(bottom:Layer {key: 'G'})
        where any(node in nodes(path) where node.key in $keys)
        return distinct path as r
      `,
      { keys }
    )

    return records.map(record => record.get('r')).filter(path => path !== null)
  }

  const getStats = paths => {
    const nodes = extractNodes(paths)
    const stats = countBy(nodes, node => node.labels[0])
    return { ...stats, Sequences: paths.length }
  }

  const run = async flt => {
    const keys = await getKeys(flt)
    const paths = await getPaths(keys.nodes)

    if (paths.length === 0) {
      return noticeResult(
        keys,
        'No sequences',
        'No maximal stratigraphic sequence matches the current filter.',
        { Sequences: 0 }
      )
    }

    const sequenceList = toSequences(paths)
    const orderedPaths = sequenceList.map(sequence => sequence.path)

    return {
      keys,
      paths: orderedPaths,
      sequences: sequenceList,
      stats: getStats(orderedPaths)
    }
  }

  const dot = async (data, flt) => {
    if (data.notice) return renderNotice(data.notice, flt)
    const seqFlt = { ...flt, viewSettings: { ...flt.viewSettings, 'graph.connect': false } }

    // prettier-ignore
    const {
      renderOrientation,
      renderPaths
    } = render(seqFlt, data)
    const isFlipped = flt.viewSettings['graph.flip']
    const packMode = isFlipped ? 'packmode = "array_cit1"' : ''
    const sequenceLabelAlignment = isFlipped ? 'labeljust="l"' : ''
    // graphviz packs LR rows bottom-to-top and maps top alignment to the left edge
    const renderedSequences = isFlipped ? [...data.sequences].reverse() : data.sequences

    const renderSequence = sequence => `
      subgraph "cluster_${sequence.id}" {
        label="${sequence.label}"
        ${sequenceLabelAlignment}
        color="gray80"
        ${renderPaths([sequence.path], {
          getPathId: () => sequence.id,
          clusterScope: sequence.id,
          rankContemporary: false,
          inlineRelationshipLabels: true
        })}
      }
    `

    return `
      digraph g {
        graph [
          compound = true
          fontsize = 10
          fontname = "Helvetica"
          layout = "dot"
          labeljust="l"
          ${packMode}
          rankdir = "${renderOrientation()}"
          ranksep = 0.2
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

        ${renderedSequences.map(renderSequence).join('\n')}
      }
    `
  }

  return {
    name: 'sequences',
    run,
    dot
  }
}

export { sequences }
