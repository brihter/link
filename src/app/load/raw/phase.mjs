import { parse } from 'csv-parse'
import { toInt, toText } from '../../../util/formatters.mjs'

const phase = ({ storage }) => {
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
    r = await storage.read('import/phase.csv')
    r = await _parse(r)
    return r
  }

  const transform = rec => {
    return {
      phase: toText(rec.phase),
      phase_from: toInt(rec.from),
      phase_to: toInt(rec.to),
      etl_src: 'phase.csv',
      etl_src_id: `${rec.phase}`
    }
  }

  const mapping = {
    phase: 'TEXT',
    phase_from: 'INTEGER',
    phase_to: 'INTEGER',
    etl_src: 'TEXT',
    etl_src_id: 'TEXT'
  }

  return {
    name: 'phase',
    mapping,
    extract,
    transform
  }
}

export { phase }
