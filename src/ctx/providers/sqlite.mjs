import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

const initSQLite = async () => {
  const db = await open({
    filename: 'db/db.sqlite',
    driver: sqlite3.Database
  })

  return db
}

const destroySQLite = async () => {
  throw new Error('NotImplemented')
}

export { initSQLite, destroySQLite }
