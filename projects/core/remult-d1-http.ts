import Cloudflare from "cloudflare"
import { SqlDatabase } from "./index.js"
import { type D1Client, D1DataProvider, type D1RowObject } from "./remult-d1.js"

type D1Credentials = { accountId: string; apiToken: string; databaseId: string }
export function createD1HttpDataProvider(creds: D1Credentials) {
	return new SqlDatabase(new D1DataProvider(new D1HttpClient(creds)))
}


export class D1HttpClient implements D1Client {
	private d1: Cloudflare["d1"]["database"]
	private accountId: string
	private databaseId: string

	constructor({ accountId, databaseId, apiToken }: D1Credentials) {
		this.d1 = new Cloudflare({ apiToken }).d1.database
		this.accountId = accountId
		this.databaseId = databaseId
	}

	async execute(sql: string, params: unknown[] = []) {
		return this.d1.query(this.databaseId, {
			sql,
			params: params as string[],
			account_id: this.accountId,
		}).then(({ result: pages }) => pages.flatMap((page) => page.results as D1RowObject[]))

		// NOTE: d1 query endpoint returns the result as array of object with keys as column names.
		// We're returning that now because the rest of remult seems to expect that.
		// D1 also has a more efficient raw() endpoint that returns {columns: string[], rows: any[][]} that we may want
		// to use eventually, and write code like fromRowToSql()
		// at https://github.com/tursodatabase/libsql-client-ts/blob/main/packages/libsql-client/src/sqlite3.ts#L398
		// to adapt the data
	}
}
