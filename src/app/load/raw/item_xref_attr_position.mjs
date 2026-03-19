import { parse } from 'csv-parse'
import { toInt, toText } from '../../../util/formatters.mjs'

const item_xref_attr_position = ({ storage }) => {
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
    r = await storage.read('import/item_xref_attr_position.csv')
    r = await _parse(r)
    return r
  }

  const transform = rec => {
    return {
      id: toInt(rec.item_id),
      position_type: toText(rec.position_type),
      etl_src: 'item_xref_attr_position.csv',
      etl_src_id: `${rec.item_id}|${rec.position_type}`
    }
  }

  const mapping = {
    item_id: 'INTEGER',
    position_type: 'TEXT',
    etl_src: 'TEXT',
    etl_src_id: 'TEXT'
  }

  return {
    name: 'item_xref_attr_position',
    mapping,
    extract,
    transform
  }
}

export { item_xref_attr_position }
