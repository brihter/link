const query = (aliases = {}) => {
  const conditions = flt => {
    const escape = v => {
      if (typeof v === 'string') {
        return `'${v}'`
      }

      return v
    }

    const wildcard = (v, filter) => {
      if (['like', 'not like'].includes(filter.operator)) {
        return v + '%'
      }

      return v
    }

    const toValue = f => {
      let pfx
      let val
      let sfx
      pfx = ['in', 'not in'].includes(f.operator) ? '(' : ''
      val = f.value
        .map(v => wildcard(v, f))
        .map(escape)
        .join(',')
      sfx = ['in', 'not in'].includes(f.operator) ? ')' : ''
      return [pfx, val, sfx].join('')
    }

    const toCondition = f => {
      const pfx = aliases[f.entity]
      const atr = f.attribute
      const opr = f.operator
      const val = toValue(f)
      return `and ${pfx}.${atr} ${opr} ${val}`
    }

    const conditions = ['where 1=1', ...flt.filters.map(toCondition)]

    return conditions.join('\n')
  }

  return {
    conditions
  }
}

export { query }
