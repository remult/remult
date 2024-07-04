import {
  ClassType,
  EntityDbNames,
  EntityFilter,
  SqlDatabase,
  dbNamesOf,
  repo,
} from '../../../../core/index.js'
import { getRelationFieldInfo } from '../../../../core/internals.js'

export class subQuery<myEntity> {
  constructor(
    private myTable: ClassType<myEntity>,
    private myField?: keyof myEntity,
  ) {
    if (!this.myField)
      //@ts-expect-error we know
      this.myField = 'id'
  }
  in<otherTable>(
    otherTable: ClassType<otherTable>,
    otherField: keyof otherTable,
    options: {
      where: EntityFilter<otherTable>
    },
  ) {
    return this._implementation(otherTable, otherField, options)
  }
  notIn<otherTable>(
    otherTable: ClassType<otherTable>,
    otherField: keyof otherTable,
    options: {
      where: EntityFilter<otherTable>
    },
  ) {
    return this._implementation(otherTable, otherField, {
      ...options,
      notIn: true,
    })
  }
  private _implementation<otherTable>(
    otherTable: ClassType<otherTable>,
    otherField: keyof otherTable,
    options: {
      notIn?: boolean
      where: EntityFilter<otherTable>
    },
  ) {
    return SqlDatabase.rawFilter(async (c) => {
      const namesOfOtherTable = await dbNamesOf(otherTable, {
        tableName: true,
      })
      const namesOfMyTable = await dbNamesOf(this.myTable, { tableName: true })
      let otherTableFilter = await SqlDatabase.filterToRaw(
        repo(otherTable),
        options.where,
        c,
        namesOfOtherTable,
      )

      return `${namesOfMyTable.$dbNameOf(this.myField as string)} ${
        options.notIn ? 'not' : ''
      } in (select ${namesOfOtherTable.$dbNameOf(
        otherField as string,
      )} from ${namesOfOtherTable} where ${otherTableFilter})`
    })
  }

  async get<relationKey extends keyof OnlyArrays<myEntity> & string>(
    relation: relationKey,
    field: keyof EntityFilter<ArrayItemType<myEntity[relationKey]>>,
  ) {
    return this.getSubQuery(relation, (namesOfOtherTable) => {
      return namesOfOtherTable.$dbNameOf(field as string)
    })
  }

  async getSubQuery<relationKey extends keyof OnlyArrays<myEntity> & string>(
    relation: relationKey,
    what: (
      namesOfOtherEntity: EntityDbNames<ArrayItemType<myEntity[relationKey]>>,
    ) => string,
    options?: {
      where?: EntityFilter<ArrayItemType<myEntity[relationKey]>>
    },
  ) {
    const rel = getRelationFieldInfo(
      repo(this.myTable).fields.find(relation as string),
    )
    if (!rel) throw new Error(`${relation} is not a relation`)
    const relFields = rel.getFields()

    let filters: string[] = []

    const namesOfOtherTable: EntityDbNames<
      ArrayItemType<myEntity[relationKey]>
    > = await dbNamesOf(rel.toEntity, {
      tableName: true,
    })
    const namesOfMyTable = await dbNamesOf(this.myTable, { tableName: true })

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
      options?.where,
      undefined,
      namesOfOtherTable,
    )
    if (otherTableFilter) filters.push(otherTableFilter)

    return `(select ${what(namesOfOtherTable)} 
      from ${namesOfOtherTable} 
      where 
      ${filters.join(' and ')}
      )`
  }

  async count<relationKey extends keyof OnlyArrays<myEntity> & string>(
    relation: relationKey,
    options?: {
      where?: EntityFilter<ArrayItemType<myEntity[relationKey]>>
    },
  ) {
    return this.getSubQuery(relation, () => `count(*)`, options)
  }
}

type OnlyArrays<T> = {
  [K in keyof T]: T[K] extends any[] ? T[K] : never
}

type ArrayItemType<T> = T extends (infer U)[] ? U : T
