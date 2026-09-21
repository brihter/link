import { InvalidArgument } from '../../util/error.mjs'

const quoteIdentifier = value => `"${value.replace(/"/g, '""')}"`
const FILTER_LOGIC = new Set(['and', 'or'])
const MAX_FILTER_DEPTH = 8
const MAX_FILTER_NODES = 100


const query = cube => {
  const columnKeys = new Set(cube.columns.map(column => column.key))

  const getFilterDefinition = filter => {
    const definition = cube.filters.find(candidate => candidate.attribute === filter.attribute)
    if (!definition) {
      throw new InvalidArgument(
        `Cube ${cube.name} does not support filter ${filter.attribute}`
      )
    }
    return definition
  }

  const getValues = (filter, definition) => {
    const values = Array.isArray(filter.value) ? filter.value : [filter.value]
    if (values.length === 0 || values.some(value => value === undefined || value === null)) {
      throw new InvalidArgument('Every filter requires a value')
    }

    return values.map(value => {
      if (definition.type !== 'number') {
        return value
      }
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value
      }

      const number = typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : Number.NaN
      if (!Number.isFinite(number)) {
        throw new InvalidArgument(`Filter ${filter.attribute} requires a numeric value`)
      }
      return number
    })
  }

  const toCondition = (filter, params) => {
    const definition = getFilterDefinition(filter)
    const operator = String(filter.operator || '').toLowerCase()
    if (!definition.operators.includes(operator)) {
      throw new InvalidArgument(
        `Cube ${cube.name} does not support operator ${filter.operator}`
      )
    }

    const column = quoteIdentifier(definition.column)
    const values = getValues(filter, definition)
    if (operator === 'in' || operator === 'not in') {
      params.push(...values)
      const placeholders = values.map(() => '?').join(', ')
      return `${column} ${operator} (${placeholders})`
    }

    const wildcardValues = ['like', 'not like'].includes(operator)
      ? values.map(value => `${value}%`)
      : values
    const conditions = wildcardValues.map(value => {
      params.push(value)
      return `${column} ${operator} ?`
    })
    const joiner = operator === 'like' ? ' or ' : ' and '
    return conditions.length === 1 ? conditions[0] : `(${conditions.join(joiner)})`
  }

  const toExpression = (node, params, state, depth = 0) => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) {
      throw new InvalidArgument('Every filter expression requires an object')
    }
    if (depth > MAX_FILTER_DEPTH) {
      throw new InvalidArgument(`Filter expressions support at most ${MAX_FILTER_DEPTH} nested groups`)
    }

    state.nodes += 1
    if (state.nodes > MAX_FILTER_NODES) {
      throw new InvalidArgument(`Filter expressions support at most ${MAX_FILTER_NODES} nodes`)
    }

    if (!Array.isArray(node.filters)) {
      return toCondition(node, params)
    }

    const logic = String(node.logic || '').toLowerCase()
    if (!FILTER_LOGIC.has(logic)) {
      throw new InvalidArgument(`Unsupported filter logic ${node.logic}`)
    }

    const conditions = node.filters
      .map(filter => toExpression(filter, params, state, depth + 1))
      .filter(Boolean)
    if (conditions.length === 0) {
      return ''
    }
    if (conditions.length === 1) {
      return conditions[0]
    }
    return `(${conditions.join(` ${logic} `)})`
  }

  const getWhere = filter => {
    const params = []
    const filters = filter && filter.filters
    const expression = Array.isArray(filters)
      ? { logic: 'and', filters }
      : filters || { logic: 'and', filters: [] }
    const condition = toExpression(expression, params, { nodes: 0 })
    const where = condition ? `where ${condition}` : ''
    return { params, where }
  }

  const getPagination = (options, params) => {
    if (options.limit === undefined) {
      if (options.offset !== undefined) {
        throw new InvalidArgument('Query offset requires a limit')
      }
      return ''
    }
    if (!Number.isSafeInteger(options.limit) || options.limit <= 0) {
      throw new InvalidArgument('Query limit must be a positive integer')
    }

    const offset = options.offset === undefined ? 0 : options.offset
    if (!Number.isSafeInteger(offset) || offset < 0) {
      throw new InvalidArgument('Query offset must be a non-negative integer')
    }

    params.push(options.limit, offset)
    return 'limit ? offset ?'
  }

  const getOrder = (orderBy, orderDirection) => {
    if (orderBy.length === 0) {
      return ''
    }

    const direction = String(orderDirection || 'ASC').toUpperCase()
    if (direction !== 'ASC' && direction !== 'DESC') {
      throw new InvalidArgument('Query order direction must be ASC or DESC')
    }
    return `order by ${orderBy.map(key => `${quoteIdentifier(key)} ${direction}`).join(', ')}`
  }

  const select = (filter, options = {}) => {
    const columns = options.columns || cube.columns.map(column => column.key)
    const orderBy = options.orderBy || []
    for (const key of [...columns, ...orderBy]) {
      if (!columnKeys.has(key)) {
        throw new InvalidArgument(`Cube ${cube.name} does not define column ${key}`)
      }
    }

    const { params, where } = getWhere(filter)
    const order = getOrder(orderBy, options.orderDirection)
    const distinct = options.distinct ? 'distinct ' : ''
    const pagination = getPagination(options, params)

    return {
      sql: `
        select ${distinct}${columns.map(quoteIdentifier).join(', ')}
        from (
          ${cube.sql}
        ) cube
        ${where}
        ${order}
        ${pagination}
      `,
      params
    }
  }

  const count = filter => {
    const { params, where } = getWhere(filter)
    return {
      sql: `
        select count(*) as "total"
        from (
          ${cube.sql}
        ) cube
        ${where}
      `,
      params
    }
  }

  return {
    count,
    select
  }
}

export { query }
