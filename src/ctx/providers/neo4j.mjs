import neo4j from 'neo4j-driver'

const dbInterface = driver => {
  const exec = async (statement = '', params = {}) => {
    const session = await driver.session()
    const data = await session.run(statement, params)
    await session.close()
    return data.records
  }

  const write = async (statement = '', items = []) => {
    const session = await driver.session()

    await session.writeTransaction(async tx => {
      const insertOne = async item => {
        await tx.run(statement, item)
      }

      let tasks = []
      tasks = items.map(insertOne)
      await Promise.all(tasks)
    })

    await session.close()
  }

  const writeRaw = async (statements = []) => {
    const session = await driver.session()

    await session.writeTransaction(async tx => {
      const tasks = statements.map(statement => tx.run(statement))
      await Promise.all(tasks)
    })

    await session.close()
  }

  return {
    getDriver: () => driver,
    exec,
    write,
    writeRaw
  }
}

const initNeo4J = async ({ config }) => {
  const driver = neo4j.driver(config.neo4j_host)
  return dbInterface(driver)
}

const destroyNeo4J = async ctx => {
  await ctx.neo4j.getDriver().close()
  delete ctx.neo4j
  return ctx
}

export { initNeo4J, destroyNeo4J }
