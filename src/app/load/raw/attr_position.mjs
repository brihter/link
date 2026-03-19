import { parse } from 'csv-parse'
import { toText } from '../../../util/formatters.mjs'

const attr_position = ({ storage }) => {
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
    r = await storage.read('import/attr_position.csv')
    r = await _parse(r)
    return r
  }

  const transform = rec => {
    return {
      type: toText(rec.type),
      description: toText(rec.description),
      etl_src: 'attr_position.csv',
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
    name: 'attr_position',
    mapping,
    extract,
    transform
  }
}

export { attr_position }
