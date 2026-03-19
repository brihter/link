import { parse } from 'csv-parse'
import { toText, toInt } from '../../../util/formatters.mjs'

const chrono_constraint = ({ storage }) => {
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
    r = await storage.read('import/chrono_constraint.csv')
    r = await _parse(r)
    return r
  }

  const transform = rec => {
    return {
      entity: toText(rec.entity),
      entity_property: toText(rec.entity_property),
      entity_id: toText(rec.entity_id),
      chrono_from: toInt(rec.chrono_from),
      chrono_to: toInt(rec.chrono_to),
      chrono_source: toText(rec.chrono_source),
      chrono_source_ref: toText(rec.chrono_source_ref),
      etl_src: 'chrono_constraint.csv',
      etl_src_id: [rec.entity, rec.entity_property, rec.entity_id].map(toText).join('||')
    }
  }

  const mapping = {
    entity: 'TEXT',
    entity_property: 'TEXT',
    entity_id: 'TEXT',
    chrono_from: 'INTEGER',
    chrono_to: 'INTEGER',
    chrono_source: 'TEXT',
    chrono_source_ref: 'TEXT',
    etl_src: 'TEXT',
    etl_src_id: 'TEXT'
  }

  return {
    name: 'chrono_constraint',
    mapping,
    extract,
    transform
  }
}

export { chrono_constraint }
