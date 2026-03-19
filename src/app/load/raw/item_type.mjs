import { parse } from 'csv-parse'
import { toText } from '../../../util/formatters.mjs'

const item_type = ({ storage }) => {
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
    r = await storage.read('import/item_type.csv')
    r = await _parse(r)
    return r
  }

  const transform = rec => {
    return {
      type: toText(rec.type),
      description: toText(rec.description),
      etl_src: 'item_type.csv',
      etl_src_id: toText(rec.type)
    }
  }

  const mapping = {
    type: 'TEXT',
    description: 'TEXT',
    etl_src: 'TEXT',
    etl_src_id: 'TEXT'
  }

  return {
    name: 'item_type',
    mapping,
    extract,
    transform
  }
}

export { item_type }
