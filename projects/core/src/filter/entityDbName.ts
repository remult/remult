import type { EntityMetadata } from '../remult3/remult3.js'

export async function entityDbName(
	metadata: EntityMetadata,
	wrapIdentifier: (name: string) => string = (x) => x,
) {
	if (metadata.options.sqlExpression) {
		if (typeof metadata.options.sqlExpression === 'string')
			return metadata.options.sqlExpression
		else if (typeof metadata.options.sqlExpression === 'function') {
			const prev = metadata.options.sqlExpression
			try {
				metadata.options.sqlExpression =
					"recursive sqlExpression call for entity '" + metadata.key + "'. "
				return await prev(metadata as any)
			} finally {
				metadata.options.sqlExpression = prev
			}
		}
	}
	return wrapIdentifier(metadata.dbName)
}