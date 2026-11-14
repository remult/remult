import { flags } from '../remult3/remult3.js'

// These mean the proxy never reached the server, so any request is safe to send again.
const isUnreachable = (err: any) =>
	err.message?.startsWith('Error occurred while trying to proxy') ||
	err.message?.startsWith('Error occured while trying to proxy') ||
	err.message?.includes('http proxy error')

// The server may have run the request before failing, so only reads are safe to send again.
const isServerFailure = (err: any) =>
	err.message?.startsWith('Gateway Timeout') || err.status == 500

export async function retry<T>(
	what: () => Promise<T>,
	options: { read: boolean } = { read: true },
): Promise<T> {
	let i = 0
	while (true) {
		try {
			return await what()
		} catch (err: any) {
			if (
				(isUnreachable(err) || (options.read && isServerFailure(err))) &&
				i++ < flags.error500RetryCount
			) {
				await new Promise((res, req) => {
					setTimeout(() => {
						res({})
					}, 500)
				})
				continue
			}
			throw err
		}
	}
}

// Finds with a long filter, counts and aggregates are POSTs too, but they only read.
const readActions = /[?&]__action=(?:(?:get|query|groupBy|count)(?:&|$)|liveQuery-)/

export const isReadPost = (url: string) => readActions.test(url)
