import { pd_app_state } from './table/pd_app_state.mjs'

import {
  getColumns,
  getColumnNames,
  getValuePlaceholders
} from '../../util/table.mjs'

const create = ({ sqlite }) => {
  return async () => {
    await sqlite.exec(`create table if not exists pd_app_state (${getColumns(pd_app_state)})`)
  }
}

export { create }
