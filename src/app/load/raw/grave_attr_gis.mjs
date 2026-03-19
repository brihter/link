import { parse } from 'csv-parse'
import { toInt, toDecimal, toText } from '../../../util/formatters.mjs'

const grave_attr_gis = ({ storage }) => {
  const _parse = data =>
    new Promise((resolve, reject) => {
      parse(data, { delimiter: ',', columns: true }, function (err, rows) {
        if (err) {
          return reject(err)
        }
        resolve(rows)
      })
    })

  const filter = (recs) => {
    const isIgnored = (r) => {
      const key = r.Koda
      const othr = r.Razno.trim()
      if (key === '1984_p0011' && othr === '') return false
      if (key === '1972_p0722' && othr === '') return false
      return true
    }

    return recs.filter(isIgnored)
  }
  
  const extract = async () => {
    let r
    r = await storage.read('import/grave_attr_gis.csv')
    r = await _parse(r)
    r = filter(r)
    return r
  }

  const transform = rec => {
    return {
      key: toText(rec['Koda']),
      attr_preservation: toInt(rec['Ohranjen']),
      attr_loc_x: toDecimal(rec['X']),
      attr_loc_y: toDecimal(rec['Y']),
      attr_loc_z: toDecimal(rec['Z']),
      attr_loc_azimuth: toInt(rec['Azimut']),
      //attr_loc_other: toText(rec['Razno']),
      attr_loc_other: '',
      source: toText(rec['Vir']),
      etl_src: 'grave_attr_gis.csv',
      etl_src_id: toText(rec['Koda'])
    }
  }

  const mapping = {
    key: 'TEXT',
    attr_preservation: 'INTEGER',
    attr_loc_x: 'REAL',
    attr_loc_y: 'REAL',
    attr_loc_z: 'REAL',
    attr_loc_azimuth: 'INTEGER',
    attr_loc_other: 'TEXT',
    source: 'TEXT',
    etl_src: 'TEXT',
    etl_src_id: 'TEXT'
  }

  return {
    name: 'grave_attr_gis',
    mapping,
    extract,
    transform
  }
}

export { grave_attr_gis }
