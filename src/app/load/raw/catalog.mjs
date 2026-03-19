import { parse } from 'csv-parse'
import { toText, toInt } from '../../../util/formatters.mjs'

const catalog = ({ storage }) => {
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
    r = await storage.read('import/catalog.csv')
    r = await _parse(r)
    return r
  }

  const transform = rec => {
    return {
      key: toText(rec.key),
      catalog_name: toText(rec.catalog_name),
      catalog_page: toText(rec.catalog_page),
      etl_src: 'catalog.csv',
      etl_src_id: [rec.catalog_name, rec.key].map(toText).join('||')
    }
  }

  const mapping = {
    key: 'TEXT',
    catalog_name: 'TEXT',
    catalog_page: 'TEXT',
    etl_src: 'TEXT',
    etl_src_id: 'TEXT'
  }

  return {
    name: 'catalog',
    mapping,
    extract,
    transform
  }
}

export { catalog }
