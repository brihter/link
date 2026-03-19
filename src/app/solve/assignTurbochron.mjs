import { parse } from 'csv-parse'

const assignTurbochron = ({ logger, storage, sqlite, neo4j }) => {
  const _parse = data =>
    new Promise((resolve, reject) => {
      parse(data, { delimiter: ',', columns: true }, function (err, rows) {
        if (err) {
          return reject(err)
        }
        resolve(rows)
      })
    })

  const load = async (file) => {
    let r
    r = await storage.read(file)
    r = await _parse(r)
    return r
  }

  const solve = async () => {
    const df = await load('turbochron/result.csv')
    await neo4j.exec(
      "MATCH (n) SET n.ts_from = null, n.ts_to = null, n.ts_length = null, n.ts_trace = [], n.phase = null", 
      {}
    )
    for (const row of df) {
      const cleanRow = {}
      for (const [key, value] of Object.entries(row)) {
        cleanRow[key] = (value === '' || value === undefined) ? null : value
      }
      await neo4j.exec(
        "MATCH (n {key: $key}) SET n.ts_from = $ts_from, n.ts_to = $ts_to, n.ts_length = $ts_length, n.phase = $phase",
        cleanRow
      )
    }
    const dfTrace = await load('turbochron/result_trace_by_vertex.csv')
    for (const row of dfTrace) {
      await neo4j.exec(
        "MATCH (n {key: $key}) SET n.ts_trace = n.ts_trace + $obj",
        {
          key: row["key"],
          obj: {
            i: row["n"],
            ts_from: row["ts_from"],
            ts_to: row["ts_to"],
            operation: row["operation"],
            source: row["source"]
          }
        }
      )
    }
    logger.info('app.solve.assignTurbochron:done')
  }

  return {
    name: 'assignTurbochron',
    solve
  }
}

export { assignTurbochron }
