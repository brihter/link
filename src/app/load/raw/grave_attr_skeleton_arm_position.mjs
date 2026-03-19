import { parse } from 'csv-parse'
import { toInt, toText } from '../../../util/formatters.mjs'

const grave_attr_skeleton_arm_position = ({ storage }) => {
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
    r = await storage.read('import/grave_attr_skeleton_arm_position.csv')
    r = await _parse(r)
    return r
  }

  const transform = rec => {
    // code is a mirror image of the skeleton
    // the first character represents the right arm
    // the second character represents the left arm
    const arm_position_code = toText(rec['arm_position_code'])

    return {
      key: toText(rec['grave_key']),
      arm_position_code,
      arm_position_type_left: toInt(arm_position_code.charAt(1)),
      arm_position_type_right: toInt(arm_position_code.charAt(0)),
      etl_src: 'grave_attr_skeleton_arm_position.csv',
      etl_src_id: toText(rec['grave_key'])
    }
  }

  const mapping = {
    key: 'TEXT',
    arm_position_code: 'TEXT',
    arm_position_type_left: 'INTEGER',
    arm_position_type_right: 'INTEGER',
    etl_src: 'TEXT',
    etl_src_id: 'TEXT'
  }

  return {
    name: 'grave_attr_skeleton_arm_position',
    mapping,
    extract,
    transform
  }
}

export { grave_attr_skeleton_arm_position }
