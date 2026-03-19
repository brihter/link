const initTimezone = async () => {
  process.env.TZ = 'UTC'
  return {}
}

const destroy = async () => {}

export { initTimezone, destroy }
