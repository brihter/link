import { parse } from 'csv-parse'
import { toInt, toDecimal, toText } from '../../../util/formatters.mjs'

const grave = ({ storage }) => {
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
    r = await storage.read('import/grave.csv')
    r = await _parse(r)
    return r
  }

  const transform = rec => {
    return {
      id: toInt(rec.id),
      key: toText(rec.key),
      type: toText(rec.type),
      attr_coordinates: toText(rec.attr_coordinates),
      attr_deceased: toInt(rec.attr_deceased),
      attr_length: toDecimal(rec.attr_length),
      attr_width: toDecimal(rec.attr_width),
      attr_depth_from: toDecimal(rec.attr_depth_from),
      attr_depth_to: toDecimal(rec.attr_depth_to),
      attr_deflation_from_north: toInt(rec.attr_deflation_from_north),
      attr_deflation: toText(rec.attr_deflation),
      notes: toText(rec.notes),
      attr_body_gender: toText(rec.attr_body_gender),
      attr_body_age_min: toDecimal(rec.attr_body_age_min),
      attr_body_age_max: toDecimal(rec.attr_body_age_max),
      etl_src: 'grave.csv',
      etl_src_id: toText(rec.id)
    }
  }

  const mapping = {
    id: 'INTEGER',
    key: 'TEXT',
    type: 'TEXT',
    attr_coordinates: 'TEXT',
    attr_deceased: 'INTEGER',
    attr_length: 'REAL',
    attr_width: 'REAL',
    attr_depth_from: 'REAL',
    attr_depth_to: 'REAL',
    attr_deflation_from_north: 'INTEGER',
    attr_deflation: 'TEXT',
    notes: 'TEXT',
    attr_body_gender: 'TEXT',
    attr_body_age_min: 'REAL',
    attr_body_age_max: 'REAL',
    etl_src: 'TEXT',
    etl_src_id: 'TEXT'
  }

  return {
    name: 'grave',
    mapping,
    extract,
    transform
  }
}

export { grave }
