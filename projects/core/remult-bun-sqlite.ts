import { SqliteCoreDataProvider } from "./remult-sqlite-core.js"
import type { SqlCommand, SqlResult } from "./src/sql-command.js"

type Database = {
  close(): void
  query(sql: string): {
    all(args?: any): any[]
  }
}

export class BunSqliteDataProvider extends SqliteCoreDataProvider {
  constructor(db: Database) {
    super(() => new BunSqliteCommand(db), async () => { db.close() })
  }
}
class BunSqliteCommand implements SqlCommand {
  values: any = {}
  i = 0
  constructor(private db: Database) { }
  async execute(sql: string): Promise<SqlResult> {
    const s = this.db.query(sql);
    return new BunSqliteSqlResult(s.all(this.values));


  }
  addParameterAndReturnSqlToken(val: any) {
    return this.param(val)
  }
  param(val: any): string {
    if (val instanceof Date) val = val.valueOf()
    if (typeof val === "boolean") val = val ? 1 : 0;
    const key = ':' + (this.i++)
    this.values[key] = (val)
    return key
  }
}
class BunSqliteSqlResult implements SqlResult {
  constructor(private result: any[]) {
    this.rows = result
  }
  rows: any[]
  getColumnKeyInResultForIndexInSelect(index: number): string {
    return Object.keys(this.result[0])[index]
  }
}