import { parse } from 'csv-parse'
import { toText } from '../../../util/formatters.mjs'

const grave_xref_grave = ({ storage }) => {
  const _parse = data =>
    new Promise((resolve, reject) => {
      parse(
        data,
        { delimiter: ',', columns: true, trim: true, quote: true },
        function (err, rows) {
          if (err) {
            return reject(err)
          }
          resolve(rows)
        }
      )
    })

  const extract = async () => {
    let r
    r = await storage.read('import/grave_xref_grave.csv')
    r = await _parse(r)
    return r
  }

  const isAlias = (rec) => {
    if (rec.From.includes('=') || rec.To.includes('=')) {
      return true
    }
    return false
  }

  const split = (rec) => {
    const getKey = (str) => {
      const index = str.indexOf(' ');
      if (index === -1) {
        return str;
      }
      return str.slice(0, index);
    }
    
    let x = [getKey(rec.From.trim())]
    if (rec.From.includes('=')) {
      x = rec.From.trim()
      x = getKey(x)
      x = Array.from(new Set(x.split('=')))
    }

    let y = [getKey(rec.To.trim())]
    if (rec.To.includes('=')) {
      y = rec.To.trim()
      y = getKey(y)
      y = Array.from(new Set(y.split('=')))
    }

    const cross = []
    for (let i = 0; i < x.length; i++) {
      for (let j = 0; j < y.length; j++) {
        // [x[i], y[j]]
        cross.push({
          Key: rec.Key,
          Relation: rec.Relation,
          From: x[i],
          To: y[j]
        })
      }
    }

    return cross
  }
  
  const transformOne = (rec) => {
    let from = rec.From
    if (from.includes('_s')) {
      from = from.slice(0, 10)
    }

    let to = rec.To
    if (to.includes('_s')) {
      to = to.slice(0, 10)
    }

    return {
      key: toText(rec.Key),
      grave_relation: toText(rec.Relation),
      grave_from: toText(from),
      grave_to: toText(to),
      etl_src: 'grave_xref_grave.csv',
      etl_src_id: `${from}|${rec.Relation}|${to}`
    }
  }
  
  const transform = rec => {
    let records = []
    if (isAlias(rec)) {
      // if alias, convert the record into an array of records
      records = split(rec)
    } else {
      records.push(rec)
    }

    const r = records.map(transformOne)    
    return r
  }

  const mapping = {
    key: 'TEXT',
    grave_relation: 'TEXT',
    grave_from: 'TEXT',
    grave_to: 'TEXT',
    etl_src: 'TEXT',
    etl_src_id: 'TEXT'
  }

  return {
    name: 'grave_xref_grave',
    mapping,
    extract,
    transform
  }
}

export { grave_xref_grave }
