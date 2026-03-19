import { parse } from 'csv-parse'
import { toInt, toText } from '../../../util/formatters.mjs'

const item_phase = ({ storage }) => {
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
    r = await storage.read('import/item_phase.csv')
    r = await _parse(r)
    return r
  }

  const transform = rec => {
    let subtype = ''
    subtype = toText(rec.subtype)
    subtype = subtype === 'N/A' ? null : subtype

    return {
      item_id: toInt(rec.item_id),
      type: toText(rec.type),
      subtype,
      phase: toText(rec.phase),
      etl_src: 'item_phase.csv',
      etl_src_id: `${rec.type}|${rec.subtype}|${rec.phase}`
    }
  }

  const mapping = {
    item_id: 'INTEGER',
    type: 'TEXT',
    subtype: 'TEXT',
    phase: 'TEXT',
    etl_src: 'TEXT',
    etl_src_id: 'TEXT'
  }

  return {
    name: 'item_phase',
    mapping,
    extract,
    transform
  }
}

export { item_phase }
