const res_grave_order_no_001 = ({ sqlite }) => {
  const query = async () => {
    return sqlite.all(`
      select
        g.key,
        g.ts_from,
        g.ts_to,
        g.attr_x loc_x,
        g.attr_y loc_y,
        g.attr_z loc_z,
        attr_azimuth,
        attr_skeleton_arm_code
      from pd_grave g
      order by
        1 asc
    `)
  }

  return {
    name: 'res_grave_order_no_001',
    query
  }
}

export { res_grave_order_no_001 }
