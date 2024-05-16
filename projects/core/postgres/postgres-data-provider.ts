import type { ClientBase, PoolConfig, QueryResult } from 'pg'
import { remult as defaultRemult } from '../src/remult-proxy.js'
import pg from 'pg'
const { Pool } = pg
import { Remult } from '../src/context.js'
import { SqlDatabase } from '../src/data-providers/sql-database.js'
import type { EntityMetadata } from '../src/remult3/remult3.js'
import type {
  SqlCommand,
  SqlImplementation,
  SqlResult,
} from '../src/sql-command.js'
import { PostgresSchemaBuilder } from './schema-builder.js'
import type {
  CanBuildMigrations,
  MigrationBuilder,
  MigrationCode,
} from '../migrations/migration-types.js'
import type { DataProvider } from '../index.js'

export interface PostgresPool extends PostgresCommandSource {
  connect(): Promise<PostgresClient>
  end(): Promise<void>
}
export interface PostgresClient extends PostgresCommandSource {
  release(): void
}

export class PostgresDataProvider
  implements SqlImplementation, CanBuildMigrations
{
  supportsJsonColumnType = true
  static getDb(dataProvider?: DataProvider): ClientBase {
    const r = (dataProvider || defaultRemult.dataProvider) as SqlDatabase
    if (!r._getSourceSql) throw 'the data provider is not an SqlDatabase'
    const me = r._getSourceSql() as PostgresDataProvider
    if (!me.pool) {
      throw 'the data provider is not a PostgresDataProvider'
    }
    return me.pool as any as ClientBase
  }
  async entityIsUsedForTheFirstTime(entity: EntityMetadata): Promise<void> {}
  getLimitSqlSyntax(limit: number, offset: number) {
    return ' limit ' + limit + ' offset ' + offset
  }

  createCommand(): SqlCommand {
    return new PostgresBridgeToSQLCommand(this.pool)
  }
  constructor(
    private pool: PostgresPool,
    private options?: {
      wrapIdentifier?: (name: string) => string
      caseInsensitiveIdentifiers?: boolean
      schema?: string
      orderByNullsFirst?: boolean
    },
  ) {
    if (options?.wrapIdentifier) this.wrapIdentifier = options.wrapIdentifier
    if (!options?.wrapIdentifier && options?.caseInsensitiveIdentifiers)
      this.wrapIdentifier = (name) => name
    if (options.orderByNullsFirst)
      this.orderByNullsFirst = options.orderByNullsFirst

    if (options?.schema) {
      this.pool = new PostgresSchemaWrapper(pool, options.schema)
    }
  }
  end() {
    return this.pool.end()
  }
  provideMigrationBuilder(builder: MigrationCode): MigrationBuilder {
    var db = new SqlDatabase(this)
    var sb = new PostgresSchemaBuilder(db, this.options?.schema)
    return {
      addColumn: async (meta, field) => {
        builder.addSql(await sb.getAddColumnScript(meta, field))
      },
      createTable: async (meta) => {
        builder.addSql(await sb.createTableScript(meta))
      },
    }
  }
  wrapIdentifier = (name) =>
    name
      .split('.')
      .map((name) =>
        name.startsWith('"') ? name : '"' + name.replace(/"/g, '""') + '"',
      )
      .join('.')

  async ensureSchema(entities: EntityMetadata<any>[]): Promise<void> {
    var db = new SqlDatabase(this)
    var sb = new PostgresSchemaBuilder(db, this.options?.schema)
    await sb.ensureSchema(entities)
  }
  orderByNullsFirst?: boolean
  async transaction(
    action: (dataProvider: SqlImplementation) => Promise<void>,
  ) {
    let client = await this.pool.connect()

    try {
      await client.query('BEGIN')
      await action({
        createCommand: () => new PostgresBridgeToSQLCommand(client),
        entityIsUsedForTheFirstTime: this.entityIsUsedForTheFirstTime,
        transaction: () => {
          throw 'nested transactions not allowed'
        },
        getLimitSqlSyntax: this.getLimitSqlSyntax,
        supportsJsonColumnType: this.supportsJsonColumnType,
        //@ts-ignore
        pool: client,
        wrapIdentifier: this.wrapIdentifier,
        orderByNullsFirst: this.orderByNullsFirst,
      })
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      await client.release()
    }
  }
}

export interface PostgresCommandSource {
  query(queryText: string, values?: any[]): Promise<QueryResult>
}

class PostgresBridgeToSQLCommand implements SqlCommand {
  constructor(private source: PostgresCommandSource) {}
  values: any[] = []
  addParameterAndReturnSqlToken(val: any) {
    return this.param(val)
  }
  param(val: any): string {
    if (Array.isArray(val)) val = JSON.stringify(val)
    this.values.push(val)
    return '$' + this.values.length
  }
  async execute(sql: string): Promise<SqlResult> {
    return this.source
      .query(sql, this.values)
      .then((r) => new PostgresBridgeToSQLQueryResult(r))
  }
}
class PostgresBridgeToSQLQueryResult implements SqlResult {
  getColumnKeyInResultForIndexInSelect(index: number): string {
    return this.r.fields[index].name
  }

  constructor(public r: QueryResult) {
    this.rows = r.rows
  }
  rows: any[]
}

export async function createPostgresConnection(
  options?: Parameters<typeof createPostgresDataProvider>[0],
) {
  return createPostgresDataProvider(options)
}
export async function createPostgresDataProvider(options?: {
  connectionString?: string
  sslInDev?: boolean
  configuration?: 'heroku' | PoolConfig
  wrapIdentifier?: (name: string) => string
  caseInsensitiveIdentifiers?: boolean
  schema?: string
  orderByNullsFirst?: boolean
}) {
  if (!options) options = {}
  let config: PoolConfig = {}
  if (options.configuration)
    if (options.configuration == 'heroku') {
      config = {
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.NODE_ENV !== 'production' && !options.sslInDev
            ? false
            : {
                rejectUnauthorized: false,
              },
      }
    } else config = options.configuration
  else {
    if (!options.connectionString)
      options.connectionString = process.env.DATABASE_URL
  }
  if (!config.connectionString && options.connectionString) {
    config.connectionString = options.connectionString
  }

  const db = new SqlDatabase(
    new PostgresDataProvider(new Pool(config), {
      wrapIdentifier: options.wrapIdentifier,
      caseInsensitiveIdentifiers: options.caseInsensitiveIdentifiers,
      schema: options.schema,
      orderByNullsFirst: options.orderByNullsFirst,
    }),
  )
  return db
}

export async function preparePostgresQueueStorage(sql: SqlDatabase) {
  let c = new Remult()
  c.dataProvider = sql
  let JobsInQueueEntity = (await import('../server/remult-api-server.js'))
    .JobsInQueueEntity
  let e = c.repo(JobsInQueueEntity)
  await sql.ensureSchema([e.metadata])
  return new (
    await import('../server/remult-api-server.js')
  ).EntityQueueStorage(c.repo(JobsInQueueEntity))
}
export class PostgresSchemaWrapper implements PostgresPool {
  constructor(
    private pool: PostgresPool,
    private schema: string,
  ) {}

  async connect(): Promise<PostgresClient> {
    let r = await this.pool.connect()

    await r.query('set search_path to ' + this.schema)
    return r
  }
  async query(queryText: string, values?: any[]): Promise<QueryResult> {
    let c = await this.connect()
    try {
      return await c.query(queryText, values)
    } finally {
      c.release()
    }
  }
  end() {
    return this.pool.end()
  }
}
