import { parse } from 'csv-parse'
import {
  toInt,
  toDecimal,
  toText,
  toBoolean
} from '../../../util/formatters.mjs'

const item = ({ storage }) => {
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
    r = await storage.read('import/item.csv')
    r = await _parse(r)
    return r
  }

  const transform = rec => {
    return {
      id: toInt(rec.id),
      type: toText(rec.type),
      subtype: toText(rec.subtype),
      internal_id: toText(rec.internal_id),
      environment_id: toText(rec.environment_id),
      attr_coordinates: toText(rec.attr_coordinates),
      attr_seen: toBoolean(rec.attr_seen),
      attr_length: toDecimal(rec.attr_length),
      attr_width: toDecimal(rec.attr_width),
      attr_thickness: toDecimal(rec.attr_thickness),
      attr_weight: toDecimal(rec.attr_weight),
      notes: toText(rec.notes),
      dt_from: toInt(rec.dt_from),
      dt_to: toInt(rec.dt_to),
      etl_src: 'item.csv',
      etl_src_id: toInt(rec.id)
    }
  }

  const mapping = {
    id: 'INTEGER',
    type: 'TEXT',
    subtype: 'TEXT',
    internal_id: 'TEXT',
    environment_id: 'TEXT',
    attr_coordinates: 'TEXT',
    attr_seen: 'INTEGER',
    attr_length: 'REAL',
    attr_width: 'REAL',
    attr_thickness: 'REAL',
    attr_weight: 'REAL',
    notes: 'TEXT',
    dt_from: 'DATE',
    dt_to: 'DATE',
    etl_src: 'TEXT',
    etl_src_id: 'INTEGER'
  }

  return {
    name: 'item',
    mapping,
    extract,
    transform
  }
}

export { item }
