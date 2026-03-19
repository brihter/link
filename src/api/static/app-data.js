Ext.ns('app_data')

app_data.entities = [
  //['Site', 'Site'],
  ['Grave', 'Grave'],
  ['Item', 'Item']
]

app_data.attributes = [
  //['Site', 'id', 'id'],
  ['Grave', 'key', 'key'],
  ['Grave', 'attr_azimuth', 'azimuth'],
  ['Grave', 'preservation', 'preservation'],
  ['Grave', 'phase', 'phase'],
  ['Grave', 'phase_source', 'phase_source'],
  ['Item', 'id', 'id'],
  ['Item', 'type', 'type'],
  ['Item', 'type_name', 'type_name'],
  ['Item', 'subtype', 'subtype'],
  ['Item', 'internal_id', 'internal_id']
]

app_data.operators = [
  ['in', 'in'],
  ['not in', 'not in'],
  ['like', 'like'],
  ['not like', 'not like'],
  ['>', '>'],
  ['>=', '>='],
  ['<', '<'],
  ['<=', '<=']
]
