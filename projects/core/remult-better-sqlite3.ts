import type { Database } from 'better-sqlite3'
import { SqliteCoreDataProvider } from './remult-sqlite-core.js';
import type { SqlCommand, SqlResult } from './src/sql-command.js';



export class BetterSqlite3DataProvider extends SqliteCoreDataProvider {
  constructor(db: Database) {
    super(() => new BetterSqlite3Command(db), async () => { db.close() })
  }
}
class BetterSqlite3Command implements SqlCommand {
  values: any = {}
  i = 0
  constructor(private db: Database) { }
  async execute(sql: string): Promise<SqlResult> {
    const s = this.db.prepare(sql);
    if (s.reader) {
      return new BetterSqlite3SqlResult(s.all(this.values));
    }
    else {
      const result = s.run(this.values);
      return new BetterSqlite3SqlResult([]);
    }

  }
  addParameterAndReturnSqlToken(val: any) {
    return this.param(val)
  }
  param(val: any): string {
    if (val instanceof Date) val = val.valueOf()
    if (typeof val === "boolean") val = val ? 1 : 0;
    const key = ':' + (this.i++)
    this.values[key.substring(1)] = (val)
    return key
  }
}
export class BetterSqlite3SqlResult implements SqlResult {
  constructor(private result: any[]) {
    this.rows = result
  }
  rows: any[]
  getColumnKeyInResultForIndexInSelect(index: number): string {
    return Object.keys(this.result[0])[index]
  }
}