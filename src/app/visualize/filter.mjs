const filter = flt => {
  const showNodes = n => {
    return flt.viewSettings['show.nodes'] || false
  }

  const showRelationships = n => {
    return flt.viewSettings['show.relationships'] || false
  }

  const showEntity = type => {
    return flt.viewSettings[`entities.${type.toLowerCase()}`]
  }

  const filterType = type => n => {
    const isType = n.labels.includes(type)
    if (!isType) {
      return true
    }

    return flt.viewSettings[`entities.${type.toLowerCase()}`]
  }

  return {
    showNodes,
    showRelationships,
    showEntity,
    filterType
  }
}

export { filter }
