/// <reference types="@cloudflare/workers-types" />

import { type SqlCommand, SqlDatabase, type SqlResult } from "./index.js"
import { SqliteCoreDataProvider } from "./remult-sqlite-core.js"

/**
 * This is a wrapper around the D1Database binding.
 * 
 * @example
 * import { createD1DataProvider } from 'remult/remult-d1'
 * import { getPlatformProxy } from 'wrangler'
 * 
 * async function initDataProvider() {
 *  // example with `DBRemult` as D1Database binding name
 *  const { env } = await getPlatformProxy<{ DBRemult: D1Database }>()
 *  return createD1DataProvider(env.DBRemult)
 * }
 * 
 * const api = remultApi({
 *  dataProvider: initDataProvider(),
 * })
 */
export function createD1DataProvider(d1: D1Database) {
	return new SqlDatabase(new D1DataProvider(new D1BindingClient(d1)))
}

/**
 * For production or local d1 using binding
 *
 * @example
 * const dataProvider = new SqlDatabase(new D1DataProvider(new D1BindingClient(d1)))
 */
export class D1DataProvider extends SqliteCoreDataProvider {
	constructor(private d1: D1Client) {
		super(
			() => new D1Command(this.d1),
			async () => {
				// afaik: d1 connection doesn't need closing,
				// so this is just a noop
			}
		)
	}
}

export type D1RowObject = Record<string, unknown>
export interface D1Client {
	execute(sql: string, params?: unknown[]): Promise<D1RowObject[]>
}

/**
 * Simple d1 client that wraps the d1 binding directly
 *
 * @example
 * const d1 = new D1BindingClient(env.DB)
 */
export class D1BindingClient implements D1Client {
	constructor(private d1: D1Database) { }

	async execute(sql: string, params: unknown[] = []) {
		// https://developers.cloudflare.com/d1/worker-api/d1-database/
		// https://developers.cloudflare.com/d1/worker-api/prepared-statements/
		//
		// Note: see if we should eventually take advantage of the raw() end point too.
		const { results } = await this.d1.prepare(sql).bind(...params).run<D1RowObject>()
		return results
	}
}

class D1Command implements SqlCommand {
	private d1: D1Client
	private params: unknown[] = []

	constructor(d1: D1Client) {
		this.d1 = d1
	}

	async execute(sql: string): Promise<SqlResult> {
		const results = await this.d1.execute(sql, this.params)
		return new D1SqlResult(results)
	}

	/** @deprecated use `param` instead*/
	addParameterAndReturnSqlToken(val: unknown) {
		return this.param(val)
	}

	param(val: unknown): string {
		let p: unknown
		if (val instanceof Date) p = val.valueOf()
		else if (typeof val === "boolean") p = val ? 1 : 0
		else p = val

		this.params.push(p)

		// According to https://developers.cloudflare.com/d1/worker-api/prepared-statements/
		// only the ordered "?NNN" and anonymous "?" param types are supported (although :AAAA seems to work too)
		const key = `?${this.params.length}`
		return key
	}
}

class D1SqlResult implements SqlResult {
	columns: string[]

	constructor(public rows: D1RowObject[] = []) {
		// NOTE: are we guaranteed that when this is reached, rows is not empty?
		this.columns = rows.length === 0 ? [] : Object.keys(rows[0])
	}

	getColumnKeyInResultForIndexInSelect(index: number): string {
		return this.columns[index]
	}
}
