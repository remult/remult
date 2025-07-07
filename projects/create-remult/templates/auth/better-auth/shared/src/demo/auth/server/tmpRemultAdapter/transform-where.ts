import type { CleanedWhere } from "better-auth/adapters"
import { RemultBetterAuthError } from "./utils"

export function transformWhereClause(where: CleanedWhere[] = []) {
	const entries = where.map((w) => {
		// if (w.connector === "AND") {
		// 	const [opKey, opValue] = convertWhereOp(w)
		// 	return ["$and", { [opKey]: opValue }]
		// }
		if (w.connector === "AND") {
			return transformWhereOp(w)
		}

		if (w.connector === "OR") {
			// This situation does not show up in adapter tests. Just log it if it comes up to see
			// realistic data points
			console.warn("OR", w)
			const [opKey, opValue] = transformWhereOp(w)
			return ["$or", { [opKey]: opValue }]
		}

		if (w.operator) {
			// This situation does not show up in adapter tests. Just log it if it comes up to see
			// realistic data points
			console.warn("Where with op only", w)
			return transformWhereOp(w)
		}

		throw new RemultBetterAuthError(`Unimplemented scenario for where clause: ${JSON.stringify(w)}`)
	})

	return Object.fromEntries(entries as [string, unknown][])
}

function transformWhereOp({
	operator,
	value,
	field,
}: CleanedWhere): [string, typeof value | { [key: string]: typeof value }] {
	const op = operator === "starts_with" ? "startsWith" : operator === "ends_with" ? "endsWith" : operator

	switch (op) {
		case "eq":
			return [field, value]
		case "ne":
		case "lt":
		case "lte":
		case "gt":
		case "gte":
		case "in":
		case "contains":
		case "startsWith":
		case "endsWith":
			// $ne, $lt, $lte, $gt, $gte, $in, $contains, $startsWith, $endsWith
			return [field, { [`$${op}`]: value }]
		default:
			throw new RemultBetterAuthError(`Unknown operator in better-auth where clause: ${JSON.stringify({ operator, value, field })}`)
	}
}
