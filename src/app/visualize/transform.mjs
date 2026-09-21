// prettier-ignore
import {
  uniqBy,
  groupBy
} from 'lodash-es'

const toNode = (path, node) => {
  return {
    id: `${path}|${node.elementId}`,
    node: node
  }
}

const toSegments = params => (acc, curr, path) => {
  let segments = []
  segments = curr.get('p').segments
  segments = segments.map(segment => {
    return {
      path: params.group === 'yes' ? 0 : path,
      segment
    }
  })

  return [...acc, ...segments]
}

// const getNodes = (nodes, params = {}) => {
//   let items = []
//   items = nodes.map(n => n._fields)
//   items = items.flat()
//   items = items.map(n => toNode(0, n))

//   return items
// }

// const toNode2 = node => {
//   return {
//     id: node.elementId,
//     node: node
//   }
// }

// const getNodes2 = (nodes, key) => {
//   let items = []
//   items = nodes.map(n => n._fields)
//   items = items.flat()
//   items = items.map(n => toNode(0, n))

//   return nodes.map(n => n.get(key)).map(n => toNode2(n))
// }

const getPathNodes = (paths, params = {}) => {
  const toNodes = (acc, curr) => {
    acc.push(toNode(curr.path, curr.segment.start))
    acc.push(toNode(curr.path, curr.segment.end))
    return acc
  }

  let nodes = []
  nodes = paths.reduce(toSegments(params), [])
  nodes = nodes.reduce(toNodes, [])
  nodes = uniqBy(nodes, 'id')

  return nodes
}

// const getPathNodesBy = (paths, params, fn) => {
//   let nodes = []
//   nodes = getPathNodes(paths, params)
//   nodes = groupBy(nodes, fn)

//   return nodes
// }

// const getPathConnections = (paths, params = {}) => {
//   const toRelationship = (path, relationship) => {
//     return {
//       id: `${path}|${relationship.startNodeElementId}|${relationship.type}|${relationship.endNodeElementId}`,
//       relationship: {
//         ...relationship,
//         startNodeElementId: `${path}|${relationship.startNodeElementId}`,
//         endNodeElementId: `${path}|${relationship.endNodeElementId}`
//       }
//     }
//   }

//   const toRelationships = (acc, curr) => {
//     acc.push(toRelationship(curr.path, curr.segment.relationship))
//     return acc
//   }

//   let connections = []
//   connections = paths.reduce(toSegments(params), [])
//   connections = connections.reduce(toRelationships, [])
//   connections = uniqBy(connections, 'id')

//   return connections
// }

const extractNodes = paths => {
  const nodes = []
  const identities = new Set()

  for (const path of paths) {
    for (const segment of path.segments) {
      if (!identities.has(segment.start.elementId)) {
        identities.add(segment.start.elementId)
        nodes.push(segment.start)
      }
      if (!identities.has(segment.end.elementId)) {
        identities.add(segment.end.elementId)
        nodes.push(segment.end)
      }
    }
  }

  return nodes
}

// prettier-ginore
export { extractNodes }
