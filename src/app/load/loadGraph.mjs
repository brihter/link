const loadGraph = ({ logger, sqlite, neo4j }) => {
  const drop = async () => {
    await neo4j.exec('MATCH (n) DETACH DELETE n')
    logger.info('app.load.graph.drop:done')
    return true
  }

  const createSite = async () => {
    await neo4j.exec(`CREATE (s:Site {
      key: "Kranj - Zupna cerkev",
      name: "Kranj - Zupna cerkev"
    })`)
    logger.info('app.load.graph.createSite:done')
    return true
  }

  const createLayers = async () => {
    await neo4j.exec(`
      MATCH (s:Site)
      CREATE
        (l1:Layer { key: "T", name: "Top" }),
        (l2:Layer { key: "G", name: "Ground" }),
        (s)-[:CONTAINS]->(l1),
        (s)-[:CONTAINS]->(l2)
    `)
    logger.info('app.load.graph.createLayers:done')
    return true
  }

  const insertGraves = async () => {
    const items = await sqlite.all(`
      select distinct
        g."key",
        g.ts_from,
        g.ts_to,
        g.ts_length,
        g.attr_preservation,
        g.attr_width,
        g.attr_length,
        g.attr_depth_from,
        g.attr_depth_to,
        g.attr_azimuth,
        g.attr_x,
        g.attr_y,
        g.attr_z,
        g.attr_skeleton_arm_code,
        g.attr_skeleton_arm_left,
        g.attr_skeleton_arm_right
      from pd_grave g
      where 1=1
      and g."key" not like '%_s%'
    `)

    await neo4j.write(
      `
      create (g:Grave {
        key: $key,
        ts_from: $ts_from,
        ts_to: $ts_to,
        ts_length: $ts_length,
        ts_trace: [],
        name: $key,
        attr_preservation: $attr_preservation,
        attr_width: $attr_width,
        attr_length: $attr_length,
        attr_depth_from: $attr_depth_from,
        attr_depth_to: $attr_depth_to,
        attr_azimuth: $attr_azimuth,
        attr_skeleton_arm_code: $attr_skeleton_arm_code,
        attr_skeleton_arm_left: $attr_skeleton_arm_left,
        attr_skeleton_arm_right: $attr_skeleton_arm_right
      })
    `,
      items
    )

    logger.info('app.load.graph.insertGraves:done')
    return true
  }

  const insertSUs = async () => {
    const items = await sqlite.all(`
      select distinct
        g."key",
        g.ts_from,
        g.ts_to,
        g.ts_length
      from pd_grave g
      where 1=1
      and g."key" like '%_s%'
    `)

    await neo4j.write(
      `
      create (g:SU {
        key: $key,
        ts_from: $ts_from,
        ts_to: $ts_to,
        ts_length: $ts_length,
        ts_trace: [],
        name: $key
      })
    `,
      items
    )

    logger.info('app.load.graph.insertSUs:done')
    return true
  }

  const connectNodes = async () => {
    logger.info('app.load.graph.connectNodes:started')

    let items = await sqlite.all(`
      select
        grave_relation node_relation,
        grave_from node_from,
        grave_to node_to
      from etl_grave_xref_grave
    `)

    const getType = key => {
      if (['T', 'G'].includes(key)) return 'Layer'
      if (key.includes('_s')) return 'SU' // if this causes issues, use /\d{4}_s.*/
      return 'Grave'
    }

    items = items.map(i => ({
      ...i,
      node_from_type: getType(i.node_from),
      node_to_type: getType(i.node_to)
    }))

    let statements = []
    statements = items.map(i => {
      return `
        match
          (g1:${i.node_from_type} { key: '${i.node_from}' }),
          (g2:${i.node_to_type} { key: '${i.node_to}' })
        create
          (g1)-[:${i.node_relation}]->(g2)
      `
    })

    await neo4j.writeRaw(statements)

    logger.info('app.load.graph.connectNodes:done')
    return true
  }

  const insertItems = async () => {
    const items = await sqlite.all(`
      select distinct
        pi.id "key",
        pi."type",
        pi."type_name",
        case when pi.subtype is null then 'N/A' else pi.subtype end as subtype,
        pi.environment_id,
        pi.internal_id,
        pi.count,
        pis.item_positions,
        pi.attr_seen,
        pi.attr_width,
        pi.attr_length,
        pi.attr_thickness,
        pi.attr_weight
      from pd_item pi
        left join pd_item_position pis on pis.item_id = pi.id
    `)

    await neo4j.write(
      `
      create (i:Item {
        key: $key,
        name: $subtype,
        type: $type,
        type_name: $type_name,
        subtype: $subtype,
        environment_id: $environment_id,
        internal_id: $internal_id,
        count: $count,
        item_positions: $item_positions,
        attr_seen: $attr_seen,
        attr_width: $attr_width,
        attr_length: $attr_length,
        attr_thickness: $attr_thickness,
        attr_weight: $attr_weight
      })
    `,
      items
    )

    logger.info('app.load.graph.insertItems:done')
    return true
  }

  const connectItems = async () => {
    logger.info('app.load.graph.connectItems:started')

    const items = await sqlite.all(`
      select distinct
        id item_id,
        grave_key grave_id
      from pd_item
    `)

    await neo4j.write(
      `
      match
        (i:Item { key: $item_id }),
        (g:Grave { key: $grave_id })
      create
        (g)-[:CONTAINS]->(i)
    `,
      items
    )

    logger.info('app.load.graph.connectItems:done')
    return true
  }
  
  const createIndices = async () => {
    const types = ['Site', 'Layer', 'Grave', 'SU', 'Item']

    const createByType = async type => {
      await Promise.all([
        neo4j.exec(`create index on :${type}`),
        neo4j.exec(`create index on :${type}(key)`)
      ])
    }

    const tasks = types.map(createByType)
    await Promise.all(tasks)

    return true
  }

  return async () => {
    let r = {}
    r.drop = await drop()
    r.createSite = await createSite()
    r.createLayers = await createLayers()
    r.insertGraves = await insertGraves()
    r.insertSUs = await insertSUs()
    r.connectNodes = await connectNodes()
    r.insertItems = await insertItems()
    r.connectItems = await connectItems()
    r.indices = await createIndices()

    return {
      created: r
    }
  }
}

export { loadGraph }
