import { cloneDeep, mapValues, groupBy } from 'lodash-es'
import { v4 as uuid } from 'uuid'

const escape = v => v.replace(/"/g, '\\"')

const render = (flt, data) => {
  const renderOrientation = () => {
    return flt.viewSettings['graph.flip'] ? 'LR' : 'TB'
  }

  function sortSwap(array, string1, string2) {
    const i1 = array.indexOf(string1)
    const i2 = array.indexOf(string2)
    if (i1 !== -1 && i2 !== -1) {
      [array[i1], array[i2]] = [array[i2], array[i1]]
    }
    return array
  }

  function sort(entries, orderKeys) {
    entries.sort((a, b) => {
      const indexA = orderKeys.indexOf(a[0])
      const indexB = orderKeys.indexOf(b[0])
      if (indexA !== -1 && indexB !== -1) return indexA - indexB
      if (indexA !== -1) return -1
      if (indexB !== -1) return 1
      return 0
    })
    return entries
  }

  const sortAttributes = (entries) => {
    if (!flt.viewSettings['graph.flip']) {
      const sortOrder = sortSwap(entries.map(([key,]) => key), 'ts_from', 'ts_to')
      entries = sort(entries, sortOrder)
    }
    return entries
  }

  const renderNode = node => {
    let header = node.properties.key

    if (node.labels.includes('Item')) {
      if (node.properties.type) header = node.properties.type
      if (node.properties.subtype) header = node.properties.subtype
    }

    let label = `"${escape(header)}"`

    if (flt.viewSettings['show.attributes']) {
      const entity = node.labels[0].toLowerCase()

      const attrs = sortAttributes(Object.entries(node.properties))
        .filter(([key]) => key !== 'name' && key !== 'ts_trace' && flt.viewAttributes[`${entity}.${key}`])
        .map(([key, val]) => `${key.replace('attr_', '').replace('item_', '')}: ${val}`)

      const srcs = flt.viewAttributes[`${entity}.ts_trace`] && node.properties.ts_trace
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
    if (flt.viewSettings['graph.highlight']) {
      if (data.keys.nodes.includes(node.properties.key)) {
        fillcolor = 'yellow'
        style = 'filled'
      } else if (node.labels.includes('Item')) {
        fillcolor = 'gray90'
        style = 'filled'
      }
    }

    const properties = [
      ['label', label],
      ['shape', shape],
      ['fillcolor', fillcolor],
      ['style', style]
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

  const renderRelationship = segment => {
    const node = segment.relationship
    const [from, to] = flt.viewSettings['graph.flip']
      ? [node.endNodeElementId, node.startNodeElementId]
      : [node.startNodeElementId, node.endNodeElementId]
    const style = node.type === 'CONTEMPORARY' ? 'dashed' : 'solid'

    if (flt.viewSettings['graph.connect'] && node.type === 'CONTEMPORARY') {
      const id = mapContemporary.get(from) || mapContemporary.get(to) || uuid()
      mapContemporary.set(from, id)
      mapContemporary.set(to, id)
    }

    const label = flt.viewSettings['graph.labels'] ? node.type : ''
    return `"${from}" -> "${to}" [ style="${style}" label="${label}" ];`
  }

  const toSegment = (path, ix) => {
    path.segments.forEach(s => (s._id = ix))
    return path.segments
  }

  const toChain = segment => {
    if (flt.viewSettings['graph.connect'] === true) {
      return segment
    }

    const newSegment = cloneDeep(segment)
    newSegment.start.elementId = `${segment._id}|${segment.start.elementId}`
    newSegment.end.elementId = `${segment._id}|${segment.end.elementId}`
    newSegment.relationship.elementId = `${segment._id}|${segment.relationship.elementId}`
    newSegment.relationship.startNodeElementId = `${segment._id}|${segment.relationship.startNodeElementId}`
    newSegment.relationship.endNodeElementId = `${segment._id}|${segment.relationship.endNodeElementId}`

    return newSegment
  }

  const renderCluster = (clusters, opts = {}) => {
    return Object.keys(clusters)
      .map((id, ix) => {
        const label = opts.label ? `label="${opts.label(id)}"` : ''
        const peripheries = 'peripheries' in opts ? `peripheries="${opts.peripheries}"` : ''
        const rank = opts.rank ? `rank=${opts.rank}` : ''

        return `
          subgraph "cluster_${ix}" {
            ${label}
            ${peripheries}
            ${rank}
            ${clusters[id].map(n => `"${n}";`).join('\n')}
          }
        `
      })
      .join('\n')
  }

  const renderNodes = nodes => {
    return nodes.map(renderNode).join('\n')
  }

  const mapContemporary = new Map()

  const renderContemporary = mapContemporary => {
    const entries = [...mapContemporary.entries()].map(([node, subgraph]) => ({ node, subgraph }))
    const contemporary = mapValues(groupBy(entries, 'subgraph'), v => v.map(i => i.node))
    return renderCluster(contemporary, { peripheries: 0, rank: 'same' })
  }

  const renderPaths = paths => {
    const nodeLookup = new Set()
    const pathLookup = new Set()

    const toPath = segment => {
      const row = []

      if (!nodeLookup.has(segment.start.elementId)) {
        row.push(renderNode(segment.start))
        nodeLookup.add(segment.start.elementId)
      }

      if (!nodeLookup.has(segment.end.elementId)) {
        row.push(renderNode(segment.end))
        nodeLookup.add(segment.end.elementId)
      }

      if (!pathLookup.has(segment.relationship.elementId)) {
        row.push(renderRelationship(segment))
        pathLookup.add(segment.relationship.elementId)
      }

      return row
    }

    let result = paths
      .flatMap(toSegment)
      .map(toChain)
      .flatMap(toPath)
      .join('\n')

    result += `\n`
    result += renderContemporary(mapContemporary)

    return result
  }

  return {
    renderOrientation,
    renderNodes,
    renderPaths
  }
}

export { render }
