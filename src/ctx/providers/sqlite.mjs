import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

// db.serialize(() => {
//   db.run("BEGIN TRANSACTION;");
//   const insertStatement = db.prepare("INSERT INTO t (a,b) VALUES (?, ?)");
//   // many times
//   insertStatement.run([a,b]);
//   insertStatement.finalize();
//   db.run("END;", () => console.log(`done`));
// });

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
