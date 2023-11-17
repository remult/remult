import { getRelationInfo } from '../src/remult3/relationInfoMember'
import type { FieldMetadata } from '../src/column-interfaces'
import type { Remult } from '../src/context'
import { allEntities } from '../src/context'
import type { SqlDatabase } from '../src/data-providers/sql-database'
import type { EntityDbNamesBase } from '../src/filter/filter-consumer-bridge-to-sql-request'
import {
  dbNamesOf,
  isDbReadonly,
} from '../src/filter/filter-consumer-bridge-to-sql-request'
import { remult as defaultRemult, remult } from '../src/remult-proxy'
import type { EntityMetadata } from '../src/remult3/remult3'
import { isAutoIncrement } from '../src/remult3/RepositoryImplementation'
import type { SqlCommand } from '../src/sql-command'
import { ValueConverters } from '../src/valueConverters'

export function postgresColumnSyntax(x: FieldMetadata, dbName: string) {
  let result = dbName
  if (x.valueType == Number) {
    if (!x.valueConverter.fieldTypeInDb)
      result += ' numeric' + (x.allowNull ? '' : ' default 0 not null')
    else
      result +=
        ' ' +
        x.valueConverter.fieldTypeInDb +
        (x.allowNull ? '' : ' default 0 not null')
  } else if (x.valueType == Date) {
    if (!x.valueConverter.fieldTypeInDb)
      if (x.valueConverter == ValueConverters.DateOnly) result += ' date'
      else result += ' timestamp'
    else result += ' ' + x.valueConverter.fieldTypeInDb
  } else if (x.valueType == Boolean)
    result += ' boolean' + (x.allowNull ? '' : ' default false not null')
  else if (x.valueConverter.fieldTypeInDb) {
    result += ' ' + x.valueConverter.fieldTypeInDb
    if (!x.allowNull && x.valueConverter.fieldTypeInDb == 'integer') {
      result += ' default 0 not null'
    }
  } else result += ' varchar' + (x.allowNull ? '' : " default '' not null")
  return result
}

export async function verifyStructureOfAllEntities(
  db: SqlDatabase,
  remult: Remult,
) {
  return await new PostgresSchemaBuilder(db).verifyStructureOfAllEntities(
    remult,
  )
}

type FOREIGN_KEY_Create = {
  source_table_schema?: string
  source_table: string
  source_column: string
  foreign_table_schema?: string
  foreign_table: string
  foreign_column: string
  update_cascade?: CascadeOption
  delete_cascade?: CascadeOption
}

type CascadeOption = 'CASCADE' | 'NO ACTION' | 'SET NULL' | 'SET DEFAULT'

type FOREIGN_KEY = FOREIGN_KEY_Create & {
  source_table_schema: string
  foreign_table_schema: string
  constraint_name: string
  update_cascade: CascadeOption
  delete_cascade: CascadeOption
}

export class PostgresSchemaBuilder {
  //@internal
  static logToConsole = true

  private removeQuotes(s: string) {
    if (s.startsWith('"') && s.endsWith('"')) {
      return s.substring(1, s.length - 1)
    }
    return s.toLocaleLowerCase()
  }

  private whereTableAndSchema(cmd: SqlCommand, e: EntityDbNamesBase) {
    let table = ''
    let schema = ''

    if (this.specifiedSchema) {
      schema = this.specifiedSchema
    }

    const splited = e.$entityName.split('.')

    // let's prioritize the specified schema at dbName level
    if (splited.length > 1) {
      schema = splited[0]
      table = splited[1]
    } else {
      table = splited[0]
    }

    const where: string[] = []
    if (schema) {
      where.push(
        `table_schema=${cmd.addParameterAndReturnSqlToken(
          this.removeQuotes(schema),
        )}`,
      )
    }
    where.push(
      `table_name=${cmd.addParameterAndReturnSqlToken(
        this.removeQuotes(table),
      )}`,
    )

    return where.join(' AND ')
  }

  private schemaAndName(e: EntityDbNamesBase) {
    if (e.$entityName.includes('.')) {
      return e.$entityName
    }
    if (this.specifiedSchema) {
      return `${this.specifiedSchema}.${e.$entityName}`
    }
    return e.$entityName
  }

  private schemaOnly(e: EntityDbNamesBase) {
    if (e.$entityName.includes('.')) {
      return e.$entityName.split('.')[0]
    }
    if (this.specifiedSchema) {
      return this.specifiedSchema
    }
    // Should default to `public`
    return 'public'
  }

  async verifyStructureOfAllEntities(remult?: Remult) {
    if (!remult) {
      remult = defaultRemult
    }
    const completed = new Set<string>()
    const entities: EntityMetadata[] = []
    for (const entityClass of [...allEntities].reverse()) {
      let entity = remult.repo(entityClass).metadata
      let e: EntityDbNamesBase = await dbNamesOf(entity)
      if (completed.has(e.$entityName)) continue
      completed.add(e.$entityName)
      entities.push(entity)
    }
    await this.ensureSchema(entities)
  }

  async ensureSchema(entities: EntityMetadata<any>[]) {
    let hadError = false
    for (const entity of entities) {
      let e: EntityDbNamesBase = await dbNamesOf(entity)
      try {
        if (!entity.options.sqlExpression) {
          if (e.$entityName.toLowerCase().indexOf('from ') < 0) {
            await this.createIfNotExist(entity)
            await this.verifyAllColumns(entity)
          }
        }
      } catch (err) {
        hadError = true
        console.error('failed verify structure of ' + e.$entityName + ' ', err)
      }
    }
    // Let's add constrains after all tables are created
    if (!hadError) {
      const existing_fk = await this.getExistingForeignKeys()

      for (const entity of entities) {
        let e: EntityDbNamesBase = await dbNamesOf(entity)
        try {
          if (!entity.options.sqlExpression) {
            if (e.$entityName.toLowerCase().indexOf('from ') < 0) {
              await this.verifyAllConstrains(existing_fk, entity)
            }
          }
        } catch (err) {
          console.error(
            'failed verify structure of ' + e.$entityName + ' ',
            err,
          )
        }
      }
    }
  }

  async getExistingForeignKeys() {
    let cmd = this.pool.createCommand()
    const foreignKeys = await cmd.execute(
      `SELECT
				tc.constraint_name,
				tc.table_schema AS source_table_schema,
				tc.table_name AS source_table,
				kcu.column_name AS source_column,
				ccu.table_schema AS foreign_table_schema,
				ccu.table_name AS foreign_table,
				ccu.column_name AS foreign_column,
				rc.update_rule AS update_cascade,
				rc.delete_rule AS delete_cascade
			FROM
				information_schema.table_constraints AS tc
				JOIN information_schema.key_column_usage AS kcu
					ON tc.constraint_name = kcu.constraint_name
					AND tc.table_schema = kcu.table_schema
				JOIN information_schema.constraint_column_usage AS ccu
					ON ccu.constraint_name = tc.constraint_name
					AND ccu.table_schema = tc.table_schema
				JOIN information_schema.referential_constraints AS rc
					ON rc.constraint_name = tc.constraint_name
					AND rc.constraint_schema = tc.table_schema
			WHERE
				tc.constraint_type = 'FOREIGN KEY'
			`,
    )

    return foreignKeys.rows as FOREIGN_KEY[]
  }

  buildFK(s: FOREIGN_KEY_Create): FOREIGN_KEY {
    let toRet = {
      constraint_name: `fk_${s.source_table}_${s.source_column}_${s.foreign_table}_${s.foreign_column}`,
      source_table_schema: s.source_table_schema ?? 'public',
      foreign_table_schema: s.foreign_table_schema ?? 'public',
      update_cascade: s.update_cascade ?? 'CASCADE',
      delete_cascade: s.delete_cascade ?? 'NO ACTION',
      ...s,
    }

    toRet = {
      ...toRet,
      constraint_name: toRet.constraint_name.replace(/"/g, ''),
      source_table: toRet.source_table.replace(/"/g, ''),
      foreign_table: toRet.foreign_table.replace(/"/g, ''),
    }

    return toRet as FOREIGN_KEY
  }

  async createIfNotExist(entity: EntityMetadata): Promise<void> {
    var c = this.pool.createCommand()
    let e: EntityDbNamesBase = await dbNamesOf(entity)

    await c
      .execute(
        `SELECT 1 FROM information_Schema.tables WHERE ` +
          `${this.whereTableAndSchema(c, e)}`,
      )
      .then(async (r) => {
        if (r.rows.length == 0) {
          let result = ''
          for (const x of entity.fields) {
            if (!isDbReadonly(x, e) || isAutoIncrement(x)) {
              if (result.length != 0) result += ','
              result += '\r\n  '

              if (isAutoIncrement(x)) result += e.$dbNameOf(x) + ' serial'
              else {
                result += postgresColumnSyntax(x, e.$dbNameOf(x))
              }
              if (x == entity.idMetadata.field) result += ' primary key'
            }
          }

          let sql = `CREATE SCHEMA IF NOT EXISTS ${this.schemaOnly(e)};
CREATE table ${this.schemaAndName(e)} (${result}\r\n)`
          if (PostgresSchemaBuilder.logToConsole) console.info(sql)
          await this.pool.execute(sql)
        }
      })
  }

  async addColumnIfNotExist<T extends EntityMetadata>(
    entity: T,
    c: (e: T) => FieldMetadata,
  ) {
    let e: EntityDbNamesBase = await dbNamesOf(entity)
    if (isDbReadonly(c(entity), e)) return
    try {
      let cmd = this.pool.createCommand()

      const colName = e.$dbNameOf(c(entity))
      if (
        (
          await cmd.execute(
            `SELECT 1 FROM information_schema.columns WHERE ` +
              `${this.whereTableAndSchema(cmd, e)} ` +
              `AND column_name=${cmd.addParameterAndReturnSqlToken(
                colName.toLocaleLowerCase(),
              )}`,
          )
        ).rows.length == 0
      ) {
        let sql =
          `ALTER table ${this.schemaAndName(e)} ` +
          `ADD column ${postgresColumnSyntax(c(entity), colName)}`
        if (PostgresSchemaBuilder.logToConsole) console.info(sql)
        await this.pool.execute(sql)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async verifyAllColumns<T extends EntityMetadata>(entity: T) {
    try {
      let cmd = this.pool.createCommand()
      let e: EntityDbNamesBase = await dbNamesOf(entity)

      let cols = (
        await cmd.execute(
          `SELECT column_name FROM information_schema.columns WHERE ` +
            `${this.whereTableAndSchema(cmd, e)}`,
        )
      ).rows.map((x) => x.column_name.toLocaleLowerCase())
      for (const col of entity.fields) {
        if (!isDbReadonly(col, e)) {
          let colName = e.$dbNameOf(col).toLocaleLowerCase()
          if (colName.startsWith('"') && colName.endsWith('"'))
            colName = colName.substring(1, colName.length - 1)
          if (!cols.includes(colName)) {
            let sql =
              `ALTER table ${this.schemaAndName(e)} ` +
              `add column ${postgresColumnSyntax(col, e.$dbNameOf(col))}`
            if (PostgresSchemaBuilder.logToConsole) console.info(sql)
            await this.pool.execute(sql)
          }
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  async verifyAllConstrains<T extends EntityMetadata>(
    existing_fk: FOREIGN_KEY[],
    entity: T,
  ) {
    try {
      let e: EntityDbNamesBase = await dbNamesOf(entity)
      const needed_fk: FOREIGN_KEY[] = []
      for (const col of entity.fields) {
        const info = getRelationInfo(col.options)
        if (info) {
          const target = remult.repo(info.toType())

          needed_fk.push(
            this.buildFK({
              source_table: e.$entityName,
              source_column: await col.getDbName(),
              foreign_table: await target.metadata.getDbName(), // TODO NOAM, this is not giving the correct name
              foreign_column: 'id', //TODO JYC find the correct target col
            }),
          )
        }
      }

      const todo = this.compareFKConstraints(existing_fk, needed_fk)
      console.log(`todo`, todo)

      //     for (const { drop, fk } of todo.to_drop) {
      //       let sql = `
      // DO $$
      // BEGIN
      //   ALTER TABLE "${fk.source_table_schema}"."${fk.source_table}" DROP CONSTRAINT ${drop};
      // END
      // $$;`
      //       if (PostgresSchemaBuilder.logToConsole) console.info(sql)
      //       await this.pool.execute(sql)
      //     }

      // for (const fk of todo.to_create) {
      //   let sql = `
      // ALTER TABLE ${this.schemaAndName(e)} ADD CONSTRAINT ${fk.constraint_name}
      // FOREIGN KEY (${fk.source_column})
      // REFERENCES ${fk.foreign_table} (${fk.foreign_column})
      // ON UPDATE ${fk.update_cascade}
      // ON DELETE ${fk.delete_cascade};`
      //   if (PostgresSchemaBuilder.logToConsole) console.info(sql)
      //   await this.pool.execute(sql)
      // }

      //     for (const { drop, fk } of todo.to_update) {
      //       let sql = `
      // DO $$
      // BEGIN
      //   ALTER TABLE ${this.schemaAndName(e)} DROP CONSTRAINT ${drop};
      //   ALTER TABLE ${this.schemaAndName(e)} ADD CONSTRAINT ${fk.constraint_name}
      //   FOREIGN KEY (${fk.source_column})
      //   REFERENCES ${fk.foreign_table} (${fk.foreign_column})
      //   ON UPDATE ${fk.update_cascade}
      //   ON DELETE ${fk.delete_cascade};
      // END
      // $$;`
      //       if (PostgresSchemaBuilder.logToConsole) console.info(sql)
      //       await this.pool.execute(sql)
      //     }
    } catch (err) {
      console.error(err)
    }
  }

  compareFKConstraints(existing_fk: FOREIGN_KEY[], needed_fk: FOREIGN_KEY[]) {
    let to_create: FOREIGN_KEY[] = []
    let to_update: { drop: string; fk: FOREIGN_KEY }[] = []
    let nothing_to_do: FOREIGN_KEY[] = []
    let to_drop: { drop: string; fk: FOREIGN_KEY }[] = []

    needed_fk.forEach((needed) => {
      const dataMatch = existing_fk.find(
        (existing) =>
          existing.source_table_schema === needed.source_table_schema &&
          existing.source_table === needed.source_table &&
          existing.source_column === needed.source_column &&
          existing.foreign_table_schema === needed.foreign_table_schema &&
          existing.foreign_table === needed.foreign_table &&
          existing.foreign_column === needed.foreign_column &&
          existing.update_cascade === needed.update_cascade &&
          existing.delete_cascade === needed.delete_cascade,
      )

      if (dataMatch) {
        if (dataMatch.constraint_name === needed.constraint_name) {
          nothing_to_do.push(needed)
        } else {
          to_update.push({ drop: dataMatch.constraint_name, fk: needed })
        }
      } else {
        to_create.push(needed)
      }
    })

    // all existing_fk that are not in any list
    existing_fk.forEach((existing) => {
      const f1 = to_create.find(
        (c) => c.constraint_name === existing.constraint_name,
      )
      const f2 = to_update.find(
        (c) => c.fk.constraint_name === existing.constraint_name,
      )
      const f3 = nothing_to_do.find(
        (c) => c.constraint_name === existing.constraint_name,
      )

      if (!f1 && !f2 && !f3) {
        to_drop.push({ drop: existing.constraint_name, fk: existing })
      }
    })

    return {
      to_create,
      to_update,
      nothing_to_do,
      to_drop,
    }
  }

  specifiedSchema = ''
  constructor(
    private pool: SqlDatabase,
    schema?: string,
  ) {
    if (schema) {
      this.specifiedSchema = schema
    }
  }
}
