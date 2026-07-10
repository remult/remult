import { SqliteCoreDataProvider } from './remult-sqlite-core.js'
import type { SqlCommand, SqlResult } from './src/sql-command.js'

export type NodeSqliteStatement = {
  setAllowBareNamedParameters(enabled: boolean): void
  all(...anonymousParameters: any[]): Record<string, unknown>[]
}

export type NodeSqliteDatabase = {
  prepare(sql: string): NodeSqliteStatement
  close(): void
}

/**
 * A Remult data provider for Node's built-in `node:sqlite` module.
 *
 * `node:sqlite` is available in Node.js 22.5.0 and newer. The database is
 * accepted structurally so importing this adapter does not load a Node-only
 * module until the application creates its `DatabaseSync` instance.
 */
export class NodeSqliteDataProvider extends SqliteCoreDataProvider {
  constructor(db: NodeSqliteDatabase) {
    super(
      () => new NodeSqliteCommand(db),
      async () => {
        db.close()
      },
    )
  }
}

class NodeSqliteCommand implements SqlCommand {
  private values: Record<string, unknown> = {}
  private i = 0

  constructor(private db: NodeSqliteDatabase) {}

  async execute(sql: string): Promise<SqlResult> {
    const statement = this.db.prepare(sql)
    statement.setAllowBareNamedParameters(true)
    const rows = Object.keys(this.values).length
      ? statement.all(this.values)
      : statement.all()
    return new NodeSqliteResult(rows)
  }

  addParameterAndReturnSqlToken(value: any): string {
    return this.param(value)
  }

  param(value: any): string {
    if (value instanceof Date) value = value.valueOf()
    if (typeof value === 'boolean') value = value ? 1 : 0
    if (value === undefined) value = null
    const key = String(this.i++)
    this.values[key] = value
    return `:${key}`
  }
}

class NodeSqliteResult implements SqlResult {
  rows: Record<string, unknown>[]

  constructor(rows: Record<string, unknown>[]) {
    this.rows = rows
  }

  getColumnKeyInResultForIndexInSelect(index: number): string {
    const first = this.rows[0]
    return first ? (Object.keys(first)[index] ?? '') : ''
  }
}
