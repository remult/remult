import { ClassType } from '../../../../core/classType.js'
import { EntityFilter, SqlDatabase } from '../../../../core/index.js'
import { ArrayItemType, subQuery } from './sub-query.js'

export function sqlRelations<entityType>(
  forEntity: ClassType<entityType>,
): SqlRelations<entityType> {
  return new Proxy(
    {},
    {
      get: (target, relationField: keyof entityType & string) => {
        return {
          count: (
            where?: EntityFilter<
              ArrayItemType<entityType[keyof entityType & string]>
            >,
          ) => {
            return new subQuery(forEntity).count(relationField, { where })
          },
          get: (
            field: keyof ArrayItemType<entityType[keyof entityType]> & string,
          ) => {
            return new subQuery(forEntity).get(relationField, field)
          },
          filterExists: (
            where?: EntityFilter<
              ArrayItemType<entityType[keyof entityType & string]>
            >,
          ) => {
            return SqlDatabase.rawFilter(async (c) => {
              return (
                'exists ' +
                (await new subQuery(forEntity).getSubQuery(
                  relationField,
                  () => '1',
                  {
                    where,
                    c,
                  },
                ))
              )
            }) as EntityFilter<unknown>
          },
        } satisfies SqlRelationTool<ArrayItemType<entityType[keyof entityType]>>
      },
    },
  ) as SqlRelations<entityType>
}

export interface SqlRelationTool<toEntity> {
  filterExists(where?: EntityFilter<toEntity>): EntityFilter<toEntity>
  count(where?: EntityFilter<toEntity>): Promise<string>
  get(field: keyof toEntity): Promise<string>
}

export type SqlRelations<entityType> = {
  [p in keyof entityType]-?: SqlRelationTool<ArrayItemType<entityType[p]>>
}

let x: Record<string, SqlRelations<any>> = {}
