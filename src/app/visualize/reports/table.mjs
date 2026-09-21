import { stringify } from 'csv-stringify/sync'

import { InvalidArgument } from '../../../util/error.mjs'

const PAGE_SIZE = 200
const SORT_DIRECTIONS = new Set(['ASC', 'DESC'])

const getPageOffset = filter => {
  const page = filter.page === undefined ? 1 : filter.page
  const offset = (page - 1) * PAGE_SIZE
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(offset)) {
    throw new InvalidArgument('Table page must be a positive integer')
  }
  return offset
}

const getSortOptions = filter => {
  if (filter.sort === undefined) {
    return {}
  }

  const attribute = filter.sort && filter.sort.attribute
  const direction = String(filter.sort && filter.sort.direction).toUpperCase()
  if (typeof attribute !== 'string' || !SORT_DIRECTIONS.has(direction)) {
    throw new InvalidArgument('Table sort requires an attribute and ASC or DESC direction')
  }
  return { orderBy: [attribute], orderDirection: direction }
}
const getExportColumns = (filter, cube) => {
  const keys = filter.exportColumns
  if (!Array.isArray(keys) || keys.length === 0 || keys.some(key => typeof key !== 'string')) {
    throw new InvalidArgument('Table export requires at least one column')
  }
  if (new Set(keys).size !== keys.length) {
    throw new InvalidArgument('Table export columns must be unique')
  }

  const columnsByKey = new Map(cube.columns.map(column => [column.key, column]))
  return keys.map(key => {
    const column = columnsByKey.get(key)
    if (!column) {
      throw new InvalidArgument(`Cube ${cube.name} does not define column ${key}`)
    }
    return column
  })
}


const table = cubes => {
  const run = async filter => {
    const cube = cubes.selected(filter)
    const sortOptions = getSortOptions(filter)

    if (filter.format === 'csv') {
      const columns = getExportColumns(filter, cube)
      const rows = await cubes.rows(filter, {
        columns: columns.map(column => column.key),
        ...sortOptions
      })
      return { columns, rows }
    }

    const offset = getPageOffset(filter)
    const [rows, rowCount] = await Promise.all([
      cubes.rows(filter, { limit: PAGE_SIZE, offset, ...sortOptions }),
      cubes.count(filter)
    ])

    return {
      columns: cube.columns.map(({ key, label }) => ({ key, label })),
      rows,
      stats: { Rows: rowCount }
    }
  }

  const json = data => ({
    columns: data.columns,
    rows: data.rows
  })

  const csv = data => stringify(data.rows, {
    columns: data.columns.map(({ key, label }) => ({ key, header: label })),
    header: true
  })

  return {
    name: 'table',
    run,
    csv,
    json
  }
}

export { table }
