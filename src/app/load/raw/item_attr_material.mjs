import { parse } from 'csv-parse'
import { toInt, toText } from '../../../util/formatters.mjs'

const item_attr_material = ({ storage }) => {
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
    r = await storage.read('import/item_attr_material.csv')
    r = await _parse(r)
    return r
  }

  const transform = rec => {
    return {
      item_id: toInt(rec.item_id),
      item_attr_material: toText(rec.item_attr_material),
      etl_src: 'item_attr_material.csv',
      etl_src_id: `${rec.item_id}`
    }
  }

  const mapping = {
    item_id: 'INTEGER',
    item_attr_material: 'TEXT',
    etl_src: 'TEXT',
    etl_src_id: 'TEXT'
  }

  return {
    name: 'item_attr_material',
    mapping,
    extract,
    transform
  }
}

export { item_attr_material }
