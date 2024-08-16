import {
  ClassType,
  EntityDbNames,
  EntityFilter,
  SqlCommandWithParameters,
  SqlDatabase,
  dbNamesOf,
  repo,
  //} from 'remult'
} from '../../../../core/index.js' // comment in the from `remult`
//import { getRelationFieldInfo } from 'remult/internals'
import { getRelationFieldInfo } from '../../../../core/internals.js' // comment in the from `remult`

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
            if (prop == '$relations') return target.$relations

            return target.$fields[
              prop as keyof ArrayItemType<entityType[keyof entityType & string]>
            ]
          },
        }),
    },
  ) as SqlRelations<entityType>
}

export type SqlRelations<entityType> = {
  [p in keyof entityType]-?: SqlRelation<
    ArrayItemType<NonNullable<entityType[p]>>
  >
}

export type SqlRelation<toEntity> = {
  $count(where?: EntityFilter<toEntity>): Promise<string>
  $subQuery(
    what: (
      fieldNamesOfToEntity: EntityDbNames<toEntity>,
    ) => string | Promise<string>,
    options?: {
      where?: EntityFilter<toEntity>
      c?: SqlCommandWithParameters
    },
  ): Promise<string>
  $relations: {
    [P in keyof toEntity]-?: SqlRelations<toEntity[P]>
  }
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

  $fields = new Proxy(this, {
    get: (target, field: keyof toEntity & string) => {
      return target.$subQuery((fieldNamesOfToEntity) =>
        fieldNamesOfToEntity.$dbNameOf(field),
      )
    },
  }) as {
    [P in keyof toEntity]: Promise<string>
  }
  $relations = new Proxy(this, {
    get: (target, field: keyof toEntity & string) => {
      const rel1 = getRelationFieldInfo(
        repo(this.myEntity).fields.find(this.relationField as string),
      )
      return new Proxy(this, {
        get: (target, field1: string) => {
          return this.$subQuery(
            () => (sqlRelations(rel1!.toEntity!) as any)[field][field1],
          )
        },
      })
    },
  }) as {
    [P in keyof toEntity]: SqlRelations<toEntity[P]>
  }

  $subQuery = async <relationKey extends keyof myEntity & string>(
    what: (
      fieldNamesOfToEntity: EntityDbNames<ArrayItemType<myEntity[relationKey]>>,
    ) => string,
    options?: {
      where?: EntityFilter<toEntity>
      c?: SqlCommandWithParameters
    },
  ) => {
    const rel = getRelationFieldInfo(
      repo(this.myEntity).fields.find(this.relationField as string),
    )
    if (!rel)
      throw new Error(`${this.relationField as string} is not a relation`)
    const relFields = rel.getFields()

    let filters: string[] = []

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
    let otherTableFilter = await SqlDatabase.filterToRaw(
      repo(rel.toEntity),
      options?.where!,
      undefined,
      namesOfOtherTable,
    )
    if (otherTableFilter) filters.push(otherTableFilter)

    return `
( SELECT ${await what(namesOfOtherTable)} 
  FROM ${namesOfOtherTable} 
  WHERE ${filters.join(' and ')}
)`
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
