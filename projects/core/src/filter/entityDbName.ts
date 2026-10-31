import type { EntityMetadata } from '../remult3/remult3.js'
import {
	isSqlExpressionInProgress,
	runSqlExpression,
} from './sqlExpressionInProgress.js'

export async function entityDbName(
	metadata: EntityMetadata,
	wrapIdentifier: (name: string) => string = (x) => x,
	forceSqlExpression = false,
) {
	if (metadata.options.sqlExpression) {
		if (typeof metadata.options.sqlExpression === 'string')
			return metadata.options.sqlExpression
		else if (typeof metadata.options.sqlExpression === 'function') {
			if (isSqlExpressionInProgress(metadata) && !forceSqlExpression)
				return "recursive sqlExpression call for entity '" + metadata.key + "'. "
			const { sqlExpression } = metadata.options
			return await runSqlExpression(metadata, () =>
				sqlExpression(metadata as any),
			)
		}
	}
	return wrapIdentifier(metadata.dbName)
}