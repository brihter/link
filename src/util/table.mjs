const getColumns = table =>
  Object.entries(table.mapping)
    .map(([column, type]) => `${column} ${type}`)
    .join(',\n')

const getColumnNames = table =>
  Object.entries(table.mapping)
    .map(([column, type]) => `${column}`)
    .join(',\n')

const getValuePlaceholders = table =>
  Object.entries(table.mapping)
    .map(([column, type]) => `?`)
    .join(',\n')

export { getColumns, getColumnNames, getValuePlaceholders }
