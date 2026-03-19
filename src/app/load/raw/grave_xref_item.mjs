import { parse } from 'csv-parse'
import { toInt, toDecimal, toText } from '../../../util/formatters.mjs'

const grave_xref_item = ({ storage }) => {
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
    r = await storage.read('import/grave_xref_item.csv')
    r = await _parse(r)
    return r
  }

  const transform = rec => {
    return {
      grave_id: toInt(rec.grave_id),
      item_id: toInt(rec.item_id),
      item_count: toInt(rec.item_count),
      etl_src: 'grave_xref_item.csv',
      etl_src_id: `${rec.grave_id}|${rec.item_id}`
    }
  }

  const mapping = {
    grave_id: 'INTEGER',
    item_id: 'INTEGER',
    item_count: 'INTEGER',
    etl_src: 'TEXT',
    etl_src_id: 'TEXT'
  }

  return {
    name: 'grave_xref_item',
    mapping,
    extract,
    transform
  }
}

export { grave_xref_item }
