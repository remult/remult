import type {
  SqlCommand,
  SqlResult,
} from './src/sql-command.js'
import type { Database, QueryExecResult } from 'sql.js'
import { SqliteCoreDataProvider } from './remult-sqlite-core.js'

export class SqlJsDataProvider extends SqliteCoreDataProvider {
  constructor(db: Promise<Database>) {
    super(() => new SqlJsCommand(db), async () => (await db).close())
  }

}
class SqlJsCommand implements SqlCommand {
  values: any = {}
  i = 0
  constructor(private db: Promise<Database>) { }
  async execute(sql: string): Promise<SqlResult> {
    if (this.i == 0) return new SqlJsSqlResult((await this.db).exec(sql))
    return new SqlJsSqlResult((await this.db).exec(sql, this.values))
  }
  addParameterAndReturnSqlToken(val: any) {
    return this.param(val)
  }
  param(val: any): string {
    if (val instanceof Date) val = val.valueOf()
    const key = ':' + ++this.i
    this.values[key] = val
    return key
  }
}

class SqlJsSqlResult implements SqlResult {
  constructor(private result: QueryExecResult[]) {
    this.rows =
      result[0]?.values.map((row) =>
        row.reduce(
          (prev, curr, i) => ({ ...prev, [result[0].columns[i]]: curr }),
          {},
        ),
      ) ?? []
  }
  rows: any[]
  getColumnKeyInResultForIndexInSelect(index: number): string {
    return this.result[0]?.columns[index]
  }
}
