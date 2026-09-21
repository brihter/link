const TEXT_FILTER_OPERATORS = Object.freeze(['in', 'not in', 'like', 'not like'])
const NUMBER_FILTER_OPERATORS = Object.freeze(['in', 'not in', '>', '>=', '<', '<='])

const toLabelWord = word => word === 'ts'
  ? 'TS'
  : `${word.charAt(0).toUpperCase()}${word.slice(1)}`

const toColumnLabel = key => {
  const [entity, ...name] = key.split('_')
  const labelWords = name.filter(word => word !== 'attr')
  return `${toLabelWord(entity)} - ${labelWords.map(toLabelWord).join(' ')}`
}

const toColumn = (key, type, operators) => {
  const label = toColumnLabel(key)
  return {
    key,
    label,
    filter: {
      attribute: key,
      label,
      operators,
      type
    }
  }
}

const textColumn = key => toColumn(key, 'text', TEXT_FILTER_OPERATORS)
const numberColumn = key => toColumn(key, 'number', NUMBER_FILTER_OPERATORS)

const columns = [
  textColumn('grave_key'),
  numberColumn('grave_ts_from'),
  numberColumn('grave_ts_to'),
  numberColumn('grave_ts_length'),
  textColumn('grave_ts_phase'),
  numberColumn('grave_attr_x'),
  numberColumn('grave_attr_y'),
  numberColumn('grave_attr_azimuth'),
  numberColumn('grave_attr_preservation'),
  numberColumn('grave_attr_depth_from'),
  numberColumn('grave_attr_depth_to'),
  textColumn('grave_attr_body_gender'),
  numberColumn('grave_attr_body_age_min'),
  numberColumn('grave_attr_body_age_max'),
  textColumn('grave_attr_body_arm_position_code')
]

const toFilters = columns => columns.map(({ key, filter }) => ({
  ...filter,
  column: key
}))

const filters = toFilters(columns)

const graves = Object.freeze({
  name: 'graves',
  label: 'Graves - Graves',
  key: 'grave_key',
  orderBy: ['grave_ts_from'],
  columns,
  filters,
  sql: `
    select distinct
      g.key grave_key,
      case when g.ts_from is null then -1 else g.ts_from end grave_ts_from,
      case when g.ts_to is null then -1 else g.ts_to end grave_ts_to,
      case when g.ts_length is null then -1 else g.ts_length end grave_ts_length,
      case when g.phase is null then 'N/A' else g.phase end grave_ts_phase,
      case when g.attr_x is null then -1 else g.attr_x end grave_attr_x,
      case when g.attr_y is null then -1 else g.attr_y end grave_attr_y,
      case when g.attr_azimuth is null then -1 else g.attr_azimuth end grave_attr_azimuth,
      case when g.attr_preservation is null then -1 else g.attr_preservation end grave_attr_preservation,
      case when g.attr_depth_from is null then -1 else g.attr_depth_from end grave_attr_depth_from,
      case when g.attr_depth_to is null then -1 else g.attr_depth_to end grave_attr_depth_to,
      case when g.attr_body_gender is null then 'N/A' else g.attr_body_gender end grave_attr_body_gender,
      case when g.attr_body_age_min is null then -1 else g.attr_body_age_min end grave_attr_body_age_min,
      case when g.attr_body_age_max is null then -1 else g.attr_body_age_max end grave_attr_body_age_max,
      case when g.attr_skeleton_arm_code is null then 'N/A' else g.attr_skeleton_arm_code end
        grave_attr_body_arm_position_code
    from pd_grave g
  `
})

const graveHasItemsColumn = numberColumn('grave_has_items')

const itemColumns = [
  numberColumn('item_id'),
  textColumn('item_type'),
  textColumn('item_type_name'),
  textColumn('item_subtype'),
  textColumn('item_phase'),
  textColumn('item_phase_source'),
  textColumn('item_internal_id'),
  numberColumn('item_count'),
  numberColumn('item_attr_seen'),
  numberColumn('item_attr_length'),
  numberColumn('item_attr_width'),
  numberColumn('item_attr_thickness'),
  numberColumn('item_attr_weight'),
  textColumn('item_attr_material'),
  textColumn('item_attr_position'),
  numberColumn('item_dt_from'),
  numberColumn('item_dt_to'),
]

const gravesWithItemsColumns = [...columns, graveHasItemsColumn, ...itemColumns]

const gravesWithItems = Object.freeze({
  name: 'graves-with-items',
  label: 'Graves - Graves with items',
  key: graves.key,
  orderBy: ['grave_ts_from', 'grave_key', 'item_id'],
  columns: gravesWithItemsColumns,
  filters: toFilters(gravesWithItemsColumns),
  sql: `
    select
      graves.*,
      case when item.grave_key is null then 0 else 1 end grave_has_items,
      case when item.id is null then -1 else item.id end item_id,
      case when item.type is null then 'N/A' else item.type end item_type,
      case when item.type_name is null then 'N/A' else item.type_name end item_type_name,
      case when item.subtype is null then 'N/A' else item.subtype end item_subtype,
      case when item.phase is null then 'N/A' else item.phase end item_phase,
      case when item.phase_source is null then 'N/A' else item.phase_source end item_phase_source,
      case when item.internal_id is null then 'N/A' else item.internal_id end item_internal_id,
      case when item."count" is null then -1 else item."count" end item_count,
      case when item.attr_seen is null then -1 else item.attr_seen end item_attr_seen,
      case when item.attr_length is null then -1 else item.attr_length end item_attr_length,
      case when item.attr_width is null then -1 else item.attr_width end item_attr_width,
      case when item.attr_thickness is null then -1 else item.attr_thickness end item_attr_thickness,
      case when item.attr_weight is null then -1 else item.attr_weight end item_attr_weight,
      case when item.attr_material is null then 'N/A' else item.attr_material end item_attr_material,
      case when item.attr_position is null then 'N/A' else item.attr_position end item_attr_position,
      case when item.dt_from is null then -1 else item.dt_from end item_dt_from,
      case when item.dt_to is null then -1 else item.dt_to end item_dt_to
    from (
      ${graves.sql}
    ) graves
    left join pd_item item on item.grave_key = graves.grave_key
  `
})

export { graves, gravesWithItems }
