import { getRelationFieldInfo } from '../remult3/relationInfoMember.js'
import type { EntityMetadata, RelationOptions } from '../remult3/remult3.js'
import type { FieldMetadata } from '../column-interfaces.js'
import {
  isSqlExpressionInProgress,
  runSqlExpression,
} from './sqlExpressionInProgress.js'

export const originalSqlExpressionKey = Symbol.for(`originalSqlExpressionKey`)
export async function fieldDbName(
  f: FieldMetadata,
  meta: EntityMetadata,
  wrapIdentifier: (name: string) => string = (x) => x,
  forceSqlExpression = false,
) {
  try {
    if (f.options.sqlExpression) {
      let result: string
      if (typeof f.options.sqlExpression === 'function') {
        if (isSqlExpressionInProgress(f) && !forceSqlExpression) {
          return "recursive sqlExpression call for field '" + f.key + "'. \0"
        }
        const { sqlExpression } = f.options
        if (!(f as any)[originalSqlExpressionKey])
          (f as any)[originalSqlExpressionKey] = sqlExpression

        result = await runSqlExpression(f, () =>
          sqlExpression(meta, undefined, undefined!),
        )
        if (!result.includes('\0')) f.options.sqlExpression = () => result
      } else result = f.options.sqlExpression
      if (!result) return f.dbName
      return result
    }
    const rel = getRelationFieldInfo(f)
    let field =
      rel?.type === 'toOne' &&
      ((f.options as RelationOptions<any, any, any>).field as string)
    if (field) {
      let fInfo = meta.fields.find(field)
      if (fInfo)
        return fieldDbName(fInfo, meta, wrapIdentifier, forceSqlExpression)
    }
    return wrapIdentifier(f.dbName)
  } finally {
  }
}
