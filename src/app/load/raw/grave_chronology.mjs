import { parse } from 'csv-parse'
import { toInt, toText } from '../../../util/formatters.mjs'

const grave_chronology = ({ storage }) => {
  const _parse = data =>
    new Promise((resolve, reject) => {
      parse(data, { delimiter: ',', columns: true }, function (err, rows) {
        if (err) {
          return reject(err)
        }
        resolve(rows)
      })
    })

  const extract = async () => {
    let r
    r = await storage.read('import/grave_chronology.csv')
    r = await _parse(r)
    return r
  }

  const transform = rec => {
    return {
      key: toText(rec.key),
      ts_from: toInt(rec.ts_from),
      ts_to: toInt(rec.ts_to),
      ts_length: toInt(rec.ts_length),
      etl_src: 'grave_chronology.csv',
      etl_src_id: `${rec.key}`
    }
  }

  const mapping = {
    key: 'TEXT',
    ts_from: 'INTEGER',
    ts_to: 'INTEGER',
    ts_length: 'INTEGER',
    etl_src: 'TEXT',
    etl_src_id: 'TEXT'
  }

  return {
    name: 'grave_chronology',
    mapping,
    extract,
    transform
  }
}

export { grave_chronology }
