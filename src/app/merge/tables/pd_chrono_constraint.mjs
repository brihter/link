const pd_chrono_constraint = ctx => {
  const mapping = {
    entity: 'TEXT',
    entity_property: 'TEXT',
    entity_id: 'TEXT',
    chrono_from: 'INTEGER',
    chrono_to: 'INTEGER',
    chrono_source: 'TEXT',
    chrono_source_ref: 'TEXT',
  }

  const source = () => {
    return `
      select
        ecc.entity,
        ecc.entity_property,
        ecc.entity_id,
        ecc.chrono_from,
        ecc.chrono_to,
        ecc.chrono_source,
        ecc.chrono_source_ref
      from etl_chrono_constraint ecc
    `
  }

  return {
    name: 'pd_chrono_constraint',
    mapping,
    source
  }
}

export { pd_chrono_constraint }
