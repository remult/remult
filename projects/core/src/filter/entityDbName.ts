import type { EntityMetadata } from '../remult3/remult3.js'

const sqlExpressionInProgressKey = Symbol.for(`entitySqlExpressionInProgressKey`)

export async function entityDbName(
	metadata: EntityMetadata,
	wrapIdentifier: (name: string) => string = (x) => x,
	forceSqlExpression = false,
) {
	if (metadata.options.sqlExpression) {
		if (typeof metadata.options.sqlExpression === 'string')
			return metadata.options.sqlExpression
		else if (typeof metadata.options.sqlExpression === 'function') {
			if ((metadata as any)[sqlExpressionInProgressKey] && !forceSqlExpression)
				return "recursive sqlExpression call for entity '" + metadata.key + "'. "
			try {
				;(metadata as any)[sqlExpressionInProgressKey] = true
				return await metadata.options.sqlExpression(metadata as any)
			} finally {
				delete (metadata as any)[sqlExpressionInProgressKey]
			}
		}
	}
	return wrapIdentifier(metadata.dbName)
}