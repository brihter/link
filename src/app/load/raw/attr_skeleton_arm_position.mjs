import { parse } from 'csv-parse'
import { toText, toInt } from '../../../util/formatters.mjs'

const attr_skeleton_arm_position = ({ storage }) => {
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
    r = await storage.read('import/attr_skeleton_arm_position.csv')
    r = await _parse(r)
    return r
  }

  const transform = rec => {
    return {
      type: toInt(rec.type),
      description: toText(rec.description),
      etl_src: 'attr_skeleton_arm_position.csv',
      etl_src_id: toInt(rec.type)
    }
  }

  const mapping = {
    type: 'INTEGER',
    description: 'TEXT',
    etl_src: 'TEXT',
    etl_src_id: 'INTEGER'
  }

  return {
    name: 'attr_skeleton_arm_position',
    mapping,
    extract,
    transform
  }
}

export { attr_skeleton_arm_position }
