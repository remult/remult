import { SqlDatabase, type SqlCommand, type SqlResult } from './index.js'
import { SqliteCoreDataProvider } from './remult-sqlite-core.js'
import type { Database } from 'sqlite3'

export async function createSqlite3DataProvider(fileName = ':memory:') {
  const sqlite3 = await import('sqlite3')
  return new SqlDatabase(
    new Sqlite3DataProvider(new sqlite3.default.Database(fileName)),
  )
}
export class Sqlite3DataProvider extends SqliteCoreDataProvider {
  constructor(db: Database) {
    super(
      () => new Sqlite3Command(db),
      async () => {
        db.close()
      },
      true,
    )
  }
}
class Sqlite3Command implements SqlCommand {
  values: any = {}
  i = 1
  constructor(private db: Database) {}
  async execute(sql: string): Promise<SqlResult> {
    return new Promise<SqlResult>((resolve, error) => {
      if (sql.startsWith('insert into')) {
        this.db.run(sql, this.values, function (err: any, rows: any[]) {
          if (err) error(err)
          else
            resolve(
              new Sqlite3SqlResult([
                //@ts-expect-error last id comes from sql lite as a lastId member of the function this
                this.lastID,
              ]),
            )
        })
      } else
        this.db.all(sql, this.values, (err, rows) => {
          if (err) error(err)
          else resolve(new Sqlite3SqlResult(rows))
        })
    })
  }
  addParameterAndReturnSqlToken(val: any) {
    return this.param(val)
  }
  param(val: any): string {
    if (val instanceof Date) val = val.valueOf()
    if (typeof val === 'boolean') val = val ? 1 : 0
    const key = ':' + this.i++
    this.values[key.substring(1)] = val
    return key
  }
}
class Sqlite3SqlResult implements SqlResult {
  constructor(private result: any[]) {
    this.rows = result
  }
  rows: any[]
  getColumnKeyInResultForIndexInSelect(index: number): string {
    return Object.keys(this.result[0])[index]
  }
}
