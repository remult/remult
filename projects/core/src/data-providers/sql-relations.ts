import type { ClassType } from '../../classType.js'
import {
  dbNamesOf,
  type EntityDbNames,
} from '../filter/filter-consumer-bridge-to-sql-request.js'
import { getRelationFieldInfo } from '../remult3/relationInfoMember.js'
import type {
  EntityFilter,
  EntityOrderBy,
  ObjectMembersOnly,
} from '../remult3/remult3.js'
import type { SqlCommandWithParameters } from '../sql-command.js'
import { SqlDatabase } from './sql-database.js'
import { remult } from '../remult-proxy.js'

export function sqlRelations<entityType>(
  forEntity: ClassType<entityType>,
): SqlRelations<entityType> {
  return new Proxy(
    {},
    {
      get: (target, relationField: keyof entityType & string) =>
        new Proxy(new SqlRelationTools(forEntity, relationField), {
          get: (target, prop) => {
            if (prop == '$count') return target.$count
            if (prop == '$subQuery') return target.$subQuery
            if (prop == '$relations') return target.___relations()
            if (prop == '$first') return target.$first

            return target.$fields[
              prop as keyof ArrayItemType<entityType[keyof entityType & string]>
            ]
          },
        }),
    },
  ) as SqlRelations<entityType>
}

export type SqlRelations<entityType> = {
  [p in keyof ObjectMembersOnly<entityType>]-?: SqlRelation<
    ArrayItemType<NonNullable<entityType[p]>>
  >
}
export type SubQueryWhat<toEntity> = (
  fieldNamesOfToEntity: EntityDbNames<toEntity>,
) => string | Promise<string>
export type SubQueryOptions<toEntity> = {
  where?: EntityFilter<toEntity>
  orderBy?: EntityOrderBy<toEntity>
  first?: boolean
  c?: SqlCommandWithParameters
}
export type SqlFirst<toEntity> = {
  $subQuery(what: SubQueryWhat<toEntity>): Promise<string>
  $relations: {
    [P in keyof ObjectMembersOnly<toEntity>]-?: SqlRelation<toEntity[P]>
  }
} & {
  [P in keyof toEntity]-?: Promise<string>
}
export type SqlRelation<toEntity> = {
  $count(where?: EntityFilter<toEntity>): Promise<string>
  $subQuery(
    what: SubQueryWhat<toEntity>,
    options?: SubQueryOptions<toEntity>,
  ): Promise<string>
  $relations: {
    [P in keyof ObjectMembersOnly<toEntity>]-?: SqlRelation<toEntity[P]>
  }
  $first(
    options?: Pick<SubQueryOptions<toEntity>, 'where' | 'orderBy'>,
  ): SqlFirst<toEntity>
} & {
  [P in keyof toEntity]-?: Promise<string>
}

class SqlRelationTools<
  myEntity,
  relationKey extends keyof myEntity,
  toEntity = ArrayItemType<myEntity[relationKey]>,
> {
  constructor(
    private myEntity: ClassType<myEntity>,
    private relationField: relationKey,
  ) {}
  $count = (where?: EntityFilter<toEntity>) => {
    return this.$subQuery(() => 'count(*)', { where })
  }

  $first = (options?: Pick<SubQueryOptions<toEntity>, 'where' | 'orderBy'>) => {
    return new Proxy(this, {
      get: (target, prop) => {
        if (prop == '$subQuery')
          return (what: SubQueryWhat<toEntity>) =>
            target.$subQuery(what, { ...options, first: true })
        if (prop == '$relations')
          return this.___relations({ ...options, first: true })
        return target.$subQuery(
          (fieldNamesOfToEntity) =>
            fieldNamesOfToEntity.$dbNameOf(prop as keyof toEntity & string),
          { ...options, first: true },
        )
      },
    })
  }

  $fields = new Proxy(this, {
    get: (target, field: keyof toEntity & string) => {
      return target.$subQuery((fieldNamesOfToEntity) =>
        fieldNamesOfToEntity.$dbNameOf(field),
      )
    },
  }) as {
    [P in keyof toEntity]: Promise<string>
  }

  $subQuery = async <relationKey extends keyof myEntity & string>(
    what: SubQueryWhat<toEntity>,
    options?: {
      where?: EntityFilter<toEntity>
      orderBy?: EntityOrderBy<toEntity>
      first?: boolean
      c?: SqlCommandWithParameters
    },
  ) => {
    const rel = getRelationFieldInfo(
      remult.repo(this.myEntity).fields.find(this.relationField as string),
    )
    if (!rel)
      throw new Error(`${this.relationField as string} is not a relation`)
    const relFields = rel.getFields()

    const filters: string[] = []

    const namesOfOtherTable: EntityDbNames<
      ArrayItemType<myEntity[relationKey]>
    > = await dbNamesOf(rel.toEntity, {
      tableName: true,
    })
    const namesOfMyTable = await dbNamesOf(this.myEntity, { tableName: true })

    for (const key in relFields.fields) {
      if (Object.prototype.hasOwnProperty.call(relFields.fields, key)) {
        filters.push(
          `${namesOfOtherTable.$dbNameOf(
            key as string,
          )} = ${namesOfMyTable.$dbNameOf(relFields.fields[key] as string)}`,
        )
      }
    }
    const otherTableFilter = await SqlDatabase.filterToRaw(
      remult.repo(rel.toEntity),
      // eslint-disable-next-line
      options?.where!,
      undefined,
      namesOfOtherTable,
    )
    if (otherTableFilter) filters.push(otherTableFilter)
    let result = `
( SELECT ${await what(namesOfOtherTable)} 
  FROM ${namesOfOtherTable} 
  WHERE ${filters.join(' and ')}`

    if (options?.orderBy) {
      result += `
  ORDER BY ${Object.keys(options.orderBy)
    .map(
      (key) =>
        `${namesOfOtherTable.$dbNameOf(key)} ${
          options.orderBy![key as unknown as keyof toEntity] as string
        }`,
    )
    .join(', ')}`
    }
    if (options?.first) {
      result += `
  LIMIT 1`
    }
    return (
      result +
      `
)`
    )
  }

  ___relations(options?: SubQueryOptions<toEntity>): any {
    return new Proxy(this, {
      get: (target, field: keyof toEntity & string) => {
        const rel1 = getRelationFieldInfo(
          remult.repo(this.myEntity).fields.find(this.relationField as string),
        )
        return new Proxy(this, {
          get: (target, field1: string) => {
            return this.$subQuery(
              () =>
                indent((sqlRelations(rel1!.toEntity!) as any)[field][field1]),
              options,
            )
          },
        })
      },
    })
  }
}
export type ArrayItemType<T> = T extends (infer U)[] ? U : T

export function sqlRelationsFilter<entityType>(
  forEntity: ClassType<entityType>,
) {
  return new Proxy(
    {},
    {
      get: (target, relationField: keyof entityType & string) =>
        new SqlRelationFilter(forEntity, relationField),
    },
  ) as {
    [p in keyof entityType]-?: SqlRelationFilter<
      entityType,
      p,
      ArrayItemType<NonNullable<entityType[p]>>
    >
  }
}

export class SqlRelationFilter<
  myEntity,
  relationKey extends keyof myEntity,
  toEntity = ArrayItemType<myEntity[relationKey]>,
> {
  private _tools: SqlRelationTools<myEntity, relationKey, toEntity>
  constructor(myEntity: ClassType<myEntity>, relationField: relationKey) {
    this._tools = new SqlRelationTools(myEntity, relationField)
  }

  some(where?: EntityFilter<toEntity>): EntityFilter<toEntity> {
    //many orms use some, every, none
    return SqlDatabase.rawFilter(async (c) => {
      return (
        'exists ' +
        (await this._tools.$subQuery(() => '1', {
          where,
          c,
        }))
      )
    })
  }
}

function indent(s: Promise<string>) {
  return s.then((s) =>
    s
      .split('\n')
      .map((x) => '  ' + x)
      .join('\n'),
  )
}
