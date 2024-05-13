import { SqlCommand, SqlImplementation, SqlResult } from './index.js'
import { SqliteCoreDataProvider } from './remult-sqlite-core.js'
import type { Client, ResultSet } from '@libsql/client'
import { cast } from './src/isOfType.js'

export class TursoDataProvider extends SqliteCoreDataProvider {
  constructor(private client: Pick<Client, 'execute'>) {
    super(
      () => new TursoCommand(client),
      async () => {
        await cast<Client>(this.client, 'close').close()
      },
      false,
    )
  }
  async transaction(
    action: (sql: SqlImplementation) => Promise<void>,
  ): Promise<void> {
    const trans = await cast<Client>(this.client, 'transaction').transaction()
    try {
      await action(new TursoDataProvider(trans))
      await trans.commit()
    } catch (err) {
      await trans.rollback()
      throw err
    }
  }
}
class TursoCommand implements SqlCommand {
  values: any = {}
  i = 1
  constructor(private db: Pick<Client, 'execute'>) {}
  async execute(sql: string): Promise<SqlResult> {
    return new TursoSqlResult(
      await this.db.execute({
        sql,
        args: this.values,
      }),
    )
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
class TursoSqlResult implements SqlResult {
  constructor(private result: ResultSet) {
    this.rows = result.rows
  }
  rows: any[]
  getColumnKeyInResultForIndexInSelect(index: number): string {
    return this.result.columns[index]
  }
}
