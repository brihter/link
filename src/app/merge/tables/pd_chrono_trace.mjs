const pd_chrono_trace = ctx => {
  const mapping = {
    key: 'TEXT',
    step: 'INTEGER',
    ts_from: 'INTEGER',
    ts_to: 'INTEGER',
    ts_source: 'TEXT'
  }

  const source = () => {
    return `
      select
        x."key",
        x."step",
        x."ts_from",
        x."ts_to",
        x."ts_source"
      from etl_grave_chronology_trace x
      order by 1,2
    `
  }

  return {
    name: 'pd_chrono_trace',
    mapping,
    source
  }
}

export { pd_chrono_trace }
