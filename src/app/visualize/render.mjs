const escape = v => v.replace(/"/g, '\\"')

const STRATIGRAPHIC_RELATIONSHIPS = Object.freeze({
  vertical: Object.freeze(['ABOVE', 'LATER']),
  context: Object.freeze(['CONTEMPORARY'])
})

const noticeResult = (keys, title, message, stats) => {
  return {
    keys,
    paths: [],
    stats: { ...stats, Status: title },
    notice: { title, message }
  }
}

const escapeDotString = value => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
const escapeDotHtml = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')


const renderNotice = (notice, flt) => {
  const rankdir = flt.viewSettings && flt.viewSettings['graph.flip'] ? 'LR' : 'TB'
  const label = `${escapeDotString(notice.title)}\\n${escapeDotString(notice.message)}`

  return `
    digraph g {
      graph [
        fontname = "Helvetica"
        rankdir = "${rankdir}"
      ];

      node [
        shape = "note"
        fontsize = 12
        fontname = "Helvetica"
        margin = 0.15
      ];

      notice [label = "${label}"];
    }
  `
}

const render = (flt, data) => {
  const selectedKeys = flt.viewSettings['graph.highlight'] ? new Set(data.keys.nodes) : null

  const renderOrientation = () => {
    return flt.viewSettings['graph.flip'] ? 'LR' : 'TB'
  }

  const sortAttributes = entries => {
    if (!flt.viewSettings['graph.flip']) {
      const fromIndex = entries.findIndex(([key]) => key === 'ts_from')
      const toIndex = entries.findIndex(([key]) => key === 'ts_to')
      if (fromIndex !== -1 && toIndex !== -1) {
        const from = entries[fromIndex]
        entries[fromIndex] = entries[toIndex]
        entries[toIndex] = from
      }
    }
    return entries
  }

  const renderC14Tooltip = measurements => {
    const count = `${measurements.length} C-14 measurement${measurements.length === 1 ? '' : 's'}`
    const details = measurements
      .map(measurement => {
        const reference = measurement.chrono_source_ref || 'n/a'
        return `${measurement.chrono_from}-${measurement.chrono_to} (${reference})`
      })
      .join('\\n')

    return `"${escape(`${count}\\n${details}`)}"`
  }

  const renderNode = node => {
    const entity = node.labels[0].toLowerCase()
    const measurementKey = `${entity}|${node.properties.key}`
    const c14Measurements = data.c14Measurements?.[measurementKey] || []
    const showC14 = flt.viewSettings.c14 && c14Measurements.length > 0
    let header = node.properties.key

    let label = `"${escape(header)}"`

    if (flt.viewSettings['show.attributes']) {
      const attrs = sortAttributes(Object.entries(node.properties))
        .filter(([key]) => key !== 'name' && key !== 'ts_trace' && flt.viewAttributes[key])
        .map(([key, val]) => `${key.replace('attr_', '').replace('item_', '')}: ${val}`)

      const srcs = flt.viewAttributes.ts_trace && node.properties.ts_trace
        ? node.properties.ts_trace.map(s => `${s.ts_from}-${s.ts_to}, ${s.source || 'n/a'}, ${s.operation}`)
        : []

      label = '<<table border="0" cellborder="0" cellspacing="0" cellpadding="0">'
      label += `<tr><td><b>${header}</b></td></tr>`
      if (attrs.length > 0) {
        label += attrs.map(a => `<tr><td align="left">${a}</td></tr>`)
      }
      if (srcs.length > 0) {
        label += `<tr><td align="left">---</td></tr>`
        label += srcs.map(s => `<tr><td align="left">${s}</td></tr>`).join('')
      }

      if (node.labels.includes('Grave') && data.subtypes) {
        const nodeSubtypes = data.subtypes[node.properties.key]
        if (nodeSubtypes && Object.keys(nodeSubtypes).length > 0) {
          label += '<tr><td><table border="0" cellborder="0" cellspacing="0" cellpadding="1"><tr><td></td></tr>'
          for (const [s, count] of Object.entries(nodeSubtypes)) {
            const text = count > 1 ? `${count} x ${s}` : s
            label += `<tr><td bgcolor="${data.palette[s]}">${text}</td></tr>`
          }
          label += '</table></td></tr>'
        }
      }

      label += '</table>>'
    }

    const shape = node.labels.includes('SU') ? 'oval' : 'box'

    let fillcolor = ''
    let style = ''
    if (showC14) {
      fillcolor = 'lightcoral'
      style = 'filled'
    } else if (flt.viewSettings['graph.highlight']) {
      if (selectedKeys.has(node.properties.key)) {
        fillcolor = 'yellow'
        style = 'filled'
      }
    }

    const properties = [
      ['label', label],
      ['shape', shape],
      ['fillcolor', fillcolor],
      ['style', style],
      ['tooltip', showC14 ? renderC14Tooltip(c14Measurements) : '']
    ]

    return `
      "${node.elementId}" [
        ${properties
        .filter(([, v]) => v.length > 0)
        .map(([k, v]) => `${k} = ${v}`)
        .join('\n')}
      ];
    `
  }

  const findContemporaryRank = node => {
    let root = node
    while (root.parent) root = root.parent
    while (node.parent) {
      const parent = node.parent
      node.parent = root
      node = parent
    }
    return root
  }

  const addContemporaryRank = (ranks, nodeIds) => {
    let root
    for (const nodeId of nodeIds) {
      let rank = ranks.get(nodeId)
      if (!rank) {
        rank = { parent: null, size: 1, minimum: nodeId }
        ranks.set(nodeId, rank)
      }
      rank = findContemporaryRank(rank)
      if (!root) {
        root = rank
        continue
      }
      if (root === rank) continue

      // preserve first-seen order and the smallest id independently of the union tree.
      if (root.size < rank.size) {
        const previousRoot = root
        root = rank
        rank = previousRoot
      }
      rank.parent = root
      root.size += rank.size
      if (rank.minimum < root.minimum) root.minimum = rank.minimum
    }
  }

  const renderRelationshipLabel = label => {
    if (label.length === 0) return ''
    return `label="${escape(label)}"`
  }

  const getRelationshipLabelNodeId = (segment, inlineRelationshipLabels) => {
    const label = flt.viewSettings['graph.labels'] ? segment.relationship.type : ''
    return label.length > 0 && inlineRelationshipLabels
      ? `relationship-label|${segment.relationship.elementId}`
      : null
  }

  const renderRelationship = (segment, options) => {
    const {
      contemporaryRanks,
      inlineRelationshipLabels,
      rankContemporary
    } = options
    const node = segment.relationship
    const [from, to] = flt.viewSettings['graph.flip']
      ? [node.endNodeElementId, node.startNodeElementId]
      : [node.startNodeElementId, node.endNodeElementId]
    const style = node.type === 'CONTEMPORARY' ? 'dashed' : 'solid'

    const label = flt.viewSettings['graph.labels'] ? node.type : ''
    const labelNodeId = getRelationshipLabelNodeId(segment, inlineRelationshipLabels)

    if (rankContemporary && node.type === 'CONTEMPORARY') {
      const rankNodes = labelNodeId ? [from, labelNodeId, to] : [from, to]
      addContemporaryRank(contemporaryRanks, rankNodes)
    }

    if (labelNodeId) {
      return [
        `"${from}" -> "${labelNodeId}" [ style="${style}" ];`,
        `"${labelNodeId}" [ label="${escape(label)}" shape="plain" margin=0 ];`,
        `"${labelNodeId}" -> "${to}" [ style="${style}" ];`
      ].join('\n')
    }

    const relationshipLabel = renderRelationshipLabel(label)
    return `"${from}" -> "${to}" [ style="${style}" ${relationshipLabel} ];`
  }

  const toChain = (segment, pathId) => {
    return {
      ...segment,
      start: {
        ...segment.start,
        elementId: `${pathId}|${segment.start.elementId}`
      },
      end: {
        ...segment.end,
        elementId: `${pathId}|${segment.end.elementId}`
      },
      relationship: {
        ...segment.relationship,
        elementId: `${pathId}|${segment.relationship.elementId}`,
        startNodeElementId: `${pathId}|${segment.relationship.startNodeElementId}`,
        endNodeElementId: `${pathId}|${segment.relationship.endNodeElementId}`
      }
    }
  }

  const renderCluster = (clusters, opts = {}) => {
    return Object.keys(clusters)
      .map((id, ix) => {
        const label = opts.label ? `label="${opts.label(id)}"` : ''
        const name = opts.name ? opts.name(id, ix) : `cluster_${ix}`
        const peripheries = 'peripheries' in opts ? `peripheries="${opts.peripheries}"` : ''
        const rank = opts.rank ? `rank=${opts.rank}` : ''

        return `
          subgraph "${name}" {
            ${label}
            ${peripheries}
            ${rank}
            ${clusters[id].map(n => `"${n}";`).join('\n')}
          }
        `
      })
      .join('\n')
  }

  const renderContemporary = contemporaryRanks => {
    const contemporary = Object.create(null)
    for (const [node, rank] of contemporaryRanks) {
      const subgraph = findContemporaryRank(rank).minimum
      if (!contemporary[subgraph]) contemporary[subgraph] = []
      contemporary[subgraph].push(node)
    }
    return renderCluster(contemporary, {
      name: id => `rank_${escape(id)}`,
      peripheries: 0,
      rank: 'same'
    })
  }

  const getPhase = node => {
    const phase = node.properties.phase
    if (phase === undefined || phase === null || phase === '') return null
    return String(phase)
  }

  const renderPhaseGroups = (segments, options) => {
    if (flt.viewSettings['graph.group.phase'] !== true) return ''

    const phases = new Map()
    const addNode = (phase, nodeId) => {
      if (phase === null || nodeId === null) return
      if (!phases.has(phase)) phases.set(phase, new Set())
      phases.get(phase).add(nodeId)
    }

    for (const segment of segments) {
      const startPhase = getPhase(segment.start)
      const endPhase = getPhase(segment.end)
      addNode(startPhase, segment.start.elementId)
      addNode(endPhase, segment.end.elementId)

      if (startPhase !== null && startPhase === endPhase) {
        const labelNodeId = getRelationshipLabelNodeId(
          segment,
          options.inlineRelationshipLabels === true
        )
        addNode(startPhase, labelNodeId)
      }
    }

    return [...phases.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([phase, nodeIds]) => {
        const clusterName = options.clusterScope
          ? `${options.clusterScope}_phase_${phase}`
          : `phase_${phase}`
        const elementId = options.clusterScope
          ? `${options.clusterScope}-phase-${phase}`
          : `phase-${phase}`

        return `
          subgraph "cluster_${escapeDotString(clusterName)}" {
            graph [
              label = <<b>Phase: ${escapeDotHtml(phase)}</b>>
              labelloc = "t"
              labeljust = "l"
              style = "rounded,filled"
              color = "#64748b"
              fillcolor = "#f8fafc"
              penwidth = 1
              margin = 12
              id = "${escapeDotString(elementId)}"
              class = "phase-cluster"
            ];

            ${[...nodeIds]
              .sort((left, right) => left.localeCompare(right))
              .map(nodeId => `"${escapeDotString(nodeId)}";`)
              .join('\n')}
          }
        `
      })
      .join('\n')
  }

  const renderPaths = (paths, options = {}) => {
    const nodeLookup = new Set()
    const pathLookup = new Set()
    const contemporaryRanks = new Map()
    const relationshipOptions = {
      contemporaryRanks,
      rankContemporary: options.rankContemporary !== false,
      inlineRelationshipLabels: options.inlineRelationshipLabels === true
    }
    const connected = flt.viewSettings['graph.connect'] === true
    const phaseSegments = flt.viewSettings['graph.group.phase'] === true ? [] : null
    const getPathId = options.getPathId || ((path, index) => index)
    const rows = []

    for (let index = 0; index < paths.length; index++) {
      const path = paths[index]
      const pathId = getPathId(path, index)
      for (const sourceSegment of path.segments) {
        const segment = connected ? sourceSegment : toChain(sourceSegment, pathId)
        if (phaseSegments) phaseSegments.push(segment)

        if (!nodeLookup.has(segment.start.elementId)) {
          rows.push(renderNode(segment.start))
          nodeLookup.add(segment.start.elementId)
        }

        if (!nodeLookup.has(segment.end.elementId)) {
          rows.push(renderNode(segment.end))
          nodeLookup.add(segment.end.elementId)
        }

        if (!pathLookup.has(segment.relationship.elementId)) {
          rows.push(renderRelationship(segment, relationshipOptions))
          pathLookup.add(segment.relationship.elementId)
        }
      }
    }

    let result = rows.join('\n')
    result += `\n`
    if (phaseSegments) result += renderPhaseGroups(phaseSegments, options)
    result += `\n`
    result += renderContemporary(contemporaryRanks)

    return result
  }

  return {
    renderOrientation,
    renderPaths
  }
}

export { render, noticeResult, renderNotice, STRATIGRAPHIC_RELATIONSHIPS }
