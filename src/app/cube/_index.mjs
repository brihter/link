import { InvalidArgument } from '../../util/error.mjs'
import { query } from './query.mjs'
import { graves, gravesWithItems } from './graves.mjs'

const toMetadata = cube => ({
  name: cube.name,
  label: cube.label,
  columns: cube.columns.map(({ key, label }) => ({ key, label })),
  filters: cube.filters.map(({ attribute, label, operators, type }) => ({
    attribute,
    label,
    operators,
    type
  }))
})

const indexCube = ({ sqlite }) => {
  const cubes = [graves, gravesWithItems]
  const definitions = new Map(cubes.map(cube => [cube.name, cube]))
  const queries = new Map(cubes.map(cube => [cube.name, query(cube)]))

  const get = name => {
    const cube = definitions.get(name)
    if (!cube) {
      throw new InvalidArgument(`Unknown cube: ${name}`)
    }
    return cube
  }

  const selected = filter => {
    const name = filter.cube && filter.cube.name
    if (!name) {
      throw new InvalidArgument('A cube is required')
    }
    return get(name)
  }

  const rows = async (filter, options = {}) => {
    const cube = selected(filter)
    const statement = queries.get(cube.name).select(filter, {
      columns: options.columns || cube.columns.map(column => column.key),
      distinct: options.distinct || false,
      limit: options.limit,
      offset: options.offset,
      orderBy: options.orderBy || cube.orderBy,
      orderDirection: options.orderDirection
    })
    return sqlite.all(statement.sql, statement.params)
  }

  const count = async filter => {
    const cube = selected(filter)
    const statement = queries.get(cube.name).count(filter)
    const record = await sqlite.get(statement.sql, statement.params)
    return record.total
  }

  const keys = async filter => {
    const cube = selected(filter)
    const records = await rows(filter, {
      columns: [cube.key],
      distinct: true,
      orderBy: [cube.key]
    })
    return records.map(record => record[cube.key]).filter(key => key !== null)
  }

  const list = () => [...definitions.values()].map(toMetadata)

  return {
    count,
    get,
    keys,
    list,
    rows,
    selected
  }
}

export { indexCube }
