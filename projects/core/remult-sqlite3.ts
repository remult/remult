import { SqlCommand, SqlResult } from '../core/index.js'
import { SqliteCoreDataProvider } from '../core/remult-sqlite-core.js'
import { Database } from 'sqlite3'

export class Sqlite3DataProvider extends SqliteCoreDataProvider {
  constructor(db: Database) {
    super(
      () => new Sqlite3Command(db),
      async () => {
        db.close()
      },
    )
  }
}
class Sqlite3Command implements SqlCommand {
  values: any = {}
  i = 1
  constructor(private db: Database) {}
  async execute(sql: string): Promise<SqlResult> {
    return new Promise<SqlResult>((resolve, error) => {
      this.db.all(sql, this.values, (err, rows) => {
        console.log(sql, rows)
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
export class Sqlite3SqlResult implements SqlResult {
  constructor(private result: any[]) {
    this.rows = result
  }
  rows: any[]
  getColumnKeyInResultForIndexInSelect(index: number): string {
    return Object.keys(this.result[0])[index]
  }
}
