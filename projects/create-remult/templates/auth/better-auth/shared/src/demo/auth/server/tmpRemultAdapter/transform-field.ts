import type { FieldAttribute, FieldType } from "better-auth/db"
import { RemultBetterAuthError } from "./utils"

export function remultIdField({ name = "id", useNumberId = false }: { name?: string; useNumberId?: boolean }) {
	if (useNumberId) {
		// NOTE: sqlite says "autoincrement" adds unnecessary overhead (https://www.sqlite.org/autoinc.html)
		// however we have to use it here because remult does not give us access to "primary key" constraint
		//
		return `@Fields.autoIncrement({required: true, allowApiUpdate: false})
		${name}! : number`.trim()
	}

	// better-auth handles id generation for us and pass it to create() so string type suffices. No need for cuid().
	return `@Fields.string({required: true, minLength: 8, maxLength: 40, validate: Validators.unique(), allowApiUpdate: false})
		${name}! : string`.trim()
}

export function transformField<T extends FieldType>(
	modelName: string,
	{ fieldName = "", type, required, unique, references, defaultValue }: FieldAttribute<T>,
	{ getClassName }: {
		getClassName: (modelName: string) => string
	}
) {
	if (!fieldName || !type) {
		throw new RemultBetterAuthError(
			`Encountered field definition without "fieldName" or "type". Please model: ${modelName}`
		)
	}

	const transformedProps = transformFieldProps({ required, defaultValue, type, unique, fieldName })

	let field = ""
	switch (type) {
		case "string":
			field = `@Fields.string(${transformedProps})
			${fieldName} = ''
			`
			break
		case "string[]":
			field = `@Fields.json(${transformedProps})
			${fieldName} : string[] = []
			`
			break
		case "number":
			field = `@Fields.integer(${transformedProps})
			${fieldName} : number
			`
			break
		case "number[]":
			field = `@Fields.json(${transformedProps})
			${fieldName} : number[] = []
			`
			break

		case "boolean":
			field = `@Fields.boolean(${transformedProps})
			${fieldName} = false
			`
			break
		case "date":
			if (fieldName === "createdAt") {
				field = `@Fields.createdAt(${transformedProps})
				${fieldName}! : Date
				`
			} else if (fieldName === "updatedAt") {
				field = `@Fields.updatedAt(${transformedProps})
				${fieldName}! : Date
				`
			} else {
				field = `@Fields.date(${transformedProps})
					${fieldName} = new Date()
					`
			}
			break
		default:
			throw new Error(`Unimplemented field type: ${JSON.stringify({ modelName, fieldName, type, defaultValue })}`)
	}

	//
	// append relation definition
	//
	if (references) {
		if (references.field !== "id") {
			// Just throw for now as we figure out if this is actually ok
			throw new RemultBetterAuthError(`Model ${modelName} references a non-id field: ${JSON.stringify(references)}`)
		}

		const fromClass = getClassName(modelName)
		const toClass = getClassName(references.model)
		field = `${field.trim()}
		@Relations.toOne<${fromClass}, ${toClass}>(() => ${toClass}, "${references.field}")
		${fieldName?.endsWith("Id") ? `${fieldName.slice(0, -2)}! : ${toClass}` : ""}
		`
	}

	return field.trim()
}

// NOTE: per @jyccouet, allowNull defaults to false by remult so we don't need this.
// function transformNullable({ type, fieldName }: { type: FieldType; fieldName?: string }) {
// 	if (
// 		(type === "string" && fieldName === "email") ||
// 		(type === "date" && ["createdAt", "updatedAt"].includes(fieldName ?? "")) ||
// 		type === "boolean"
// 	)
// 		return false

// 	return undefined
// }

function transformValidators({ type, unique, fieldName }: { type: FieldType; unique?: boolean; fieldName?: string }) {
	const v = [
		unique ? "Validators.unique()" : undefined,
		type === "string" && fieldName === "email" ? "Validators.email()" : undefined,
	].filter((v) => typeof v !== "undefined")

	return v.length > 1 ? `[${v.join(", ")}]` : v.length === 1 ? v[0] : undefined
}

function transformDefaultVal({ defaultValue }: { defaultValue?: FieldAttribute["defaultValue"] }) {
	// remult defaultValue is a function so transform if needed
	return typeof defaultValue === "function"
		? `${defaultValue.toString().replace(/\/\*.*\*\//, "")}`
		: typeof defaultValue !== "undefined"
			? `() => ${JSON.stringify(defaultValue)}`
			: undefined
}


function transformFieldProps({ required, defaultValue, type, unique, fieldName = "" }: FieldAttribute): string {
	function shouldAllowApiUpdate() {
		if (type === "date" && ["createdAt", "updatedAt"].includes(fieldName)) return false

		// NOTE: ideally we should check these fields against their model names as well
		if (["token", "accountId", "providerId", "accessToken", "refreshToken", "password"].includes(fieldName)) return false
		return undefined
	}

	const props = Object.entries({
		required,
		defaultValue: transformDefaultVal({ defaultValue }),
		validate: transformValidators({ type, unique, fieldName }),
		// allowNull: transformNullable({ type, fieldName }), NOTE: per @jyccouet, allowNull defaults to false by remult so we don't need this.
		allowApiUpdate: shouldAllowApiUpdate(),
		includeInApi: fieldName?.includes("email") ? false : undefined,
		//
		// NOTE: dbReadOnly doesn't seem to work as expected
		// dbReadOnly: type === "date" && ["createdAt", "updatedAt"].includes(fieldName ?? "") ? true : undefined
	})
		.filter(([_k, v]) => typeof v !== "undefined")
		.map(([k, v]) => `${k}: ${v}`)

	return props.length > 0 ? `{${props.join(", ")}}` : ""
}
