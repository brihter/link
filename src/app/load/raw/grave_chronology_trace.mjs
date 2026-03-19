import { parse } from 'csv-parse'
import { toInt, toText } from '../../../util/formatters.mjs'

const grave_chronology_trace = ({ storage }) => {
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
    r = await storage.read('import/grave_chronology_trace.csv')
    r = await _parse(r)
    return r
  }

  const transform = rec => {
    let ts = ''
    ts = toText(rec.value)
    ts = ts.replace('(', '')
    ts = ts.replace(')', '')
    ts = ts.replace(' ', '')

    const [ts_from, ts_to] = ts.split(',')

    return {
      step: toInt(rec.n),
      key: toText(rec.id),
      ts_from: toInt(ts_from),
      ts_to: toInt(ts_to),
      ts_source: toText(rec.step),
      etl_src: 'grave_chronology_trace.csv',
      etl_src_id: `${rec.index}`
    }
  }

  const mapping = {
    step: 'INTEGER',
    key: 'TEXT',
    ts_from: 'INTEGER',
    ts_to: 'INTEGER',
    ts_source: 'TEXT',
    etl_src: 'TEXT',
    etl_src_id: 'TEXT'
  }

  return {
    name: 'grave_chronology_trace',
    mapping,
    extract,
    transform
  }
}

export { grave_chronology_trace }
