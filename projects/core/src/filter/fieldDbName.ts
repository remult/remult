import { getRelationFieldInfo } from '../remult3/relationInfoMember.js'
import type { EntityMetadata, RelationOptions } from "../remult3/remult3.js"
import type { FieldMetadata } from '../column-interfaces.js'

const sqlExpressionInProgressKey = Symbol.for(`sqlExpressionInProgressKey`)
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
				if ((f as any)[sqlExpressionInProgressKey] && !forceSqlExpression) {
					return "recursive sqlExpression call for field '" + f.key + "'. \0"
				}
				try {
					; (f as any)[sqlExpressionInProgressKey] = true

					result = await f.options.sqlExpression(meta)
					if (!result.includes('\0')) f.options.sqlExpression = () => result
				} finally {
					delete (f as any)[sqlExpressionInProgressKey]
				}
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
