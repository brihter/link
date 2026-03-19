import { stringify } from 'csv-stringify/sync'

import { dqa_item_count } from './reports/dqa-item-count.mjs'
import { dqa_item_attr_width } from './reports/dqa-item-attr-width.mjs'
import { dqa_item_attr_length } from './reports/dqa-item-attr-length.mjs'
import { dqa_item_attr_thickness } from './reports/dqa-item-attr-thickness.mjs'
import { dqa_item_subtype } from './reports/dqa-item-subtype.mjs'
import { dqa_grave_item_subtype } from './reports/dqa-grave-item-subtype.mjs'
import { g_chain_count } from './reports/g-chain-count.mjs'
import { g_grave } from './reports/g-grave.mjs'
import { g_grave_phase } from './reports/g-grave-phase.mjs'
import { g_grave_phase_phasesource } from './reports/g-grave-phase-phasesource.mjs'
import { g_grave_stats } from './reports/g-grave-stats.mjs'
import { g_grave_path_stats } from './reports/g-grave-path-stats.mjs'
import { dqa_grave_hmc_missing } from './reports/dqa-grave-hmc-missing.mjs'
import { dqa_grave_arm_position_missing } from './reports/dqa-grave-arm-position-missing.mjs'
import { res_grave_order_no_001 } from './reports/res-grave-order_no_001.mjs'

const indexAnalyze = ({ logger, storage, sqlite, neo4j }) => {
  const reports = [
    dqa_item_count({ sqlite }),
    dqa_item_attr_width({ sqlite }),
    dqa_item_attr_length({ sqlite }),
    dqa_item_attr_thickness({ sqlite }),
    dqa_item_subtype({ sqlite }),
    dqa_grave_item_subtype({ sqlite }),
    g_chain_count({ neo4j }),
    g_grave({ sqlite }),
    g_grave_phase({ sqlite }),
    g_grave_phase_phasesource({ sqlite }),
    g_grave_stats({ sqlite }),
    g_grave_path_stats({ sqlite }),
    dqa_grave_hmc_missing({ sqlite }),
    dqa_grave_arm_position_missing({ sqlite }),
    res_grave_order_no_001({ sqlite })
  ]

  const query = async report => {
    return await report.query()
  }

  const save = async (report, data) => {
    if (data.length === 0) {
      return
    }

    let columns = []
    columns = Object.keys(data[0])

    let values = []
    values = data.map(r => Object.values(r))

    const csv = stringify(values, {
      header: true,
      columns
    })

    await storage.write(`analysis/${report.name}.csv`, csv)
  }

  const runOne = async report => {
    const data = await query(report)
    await save(report, data)
    logger.info('app.analyze.runOne:done', { params: { name: report.name } })
    return {
      name: report.name,
      count: data.length
    }
  }

  return async () => {
    let tasks = []
    tasks = reports.map(runOne)

    let results = []
    results = await Promise.all(tasks)
    logger.info('app.analyze:done')

    return results
  }
}

export { indexAnalyze }
