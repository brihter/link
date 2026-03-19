import { isNull, isUndefined, isNaN, isEmpty } from 'lodash-es'

const toInt = (str = '') => {
  if (isNaN(str)) return null
  if (isNull(str)) return null
  if (isUndefined(str)) return null
  if (isEmpty(str)) return null
  if (str === 'NULL') return null

  str = str.trim()
  return parseInt(str)
}

const toDecimal = (str = '') => {
  if (isNaN(str)) return null
  if (isNull(str)) return null
  if (isUndefined(str)) return null
  if (isEmpty(str)) return null
  if (str === 'NULL') return null

  str = str.trim()
  str = str.replace(',', '.')
  return parseFloat(str)
}

const toText = (str = '') => {
  if (str === 'NULL') return null
  str = str.trim()
  if (str.length === 0) return null
  return str
}

const toBoolean = (str = '') => {
  if (str === 'NULL') return false
  if (str === 'True' || str === 'true' || str === 'TRUE') return 1
  if (str === 'False' || str === 'false' || str === 'FALSE') return 0
}

export { toInt, toDecimal, toText, toBoolean }
