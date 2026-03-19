const dqa_grave_arm_position_missing = ({ sqlite }) => {
  const query = async () => {
    return sqlite.all(`
      select
        key,
        attr_skeleton_arm_code,
        attr_skeleton_arm_left,
        attr_skeleton_arm_right
      from pd_grave pg where attr_skeleton_arm_code like '%9%'
      order by
        1 asc
    `)
  }

  return {
    name: 'dqa-grave-arm-position-missing',
    query
  }
}

export { dqa_grave_arm_position_missing }
