import { flags } from '../remult3/remult3.js'

export async function retry<T>(what: () => Promise<T>): Promise<T> {
	let i = 0
	while (true) {
		try {
			return await what()
		} catch (err: any) {
			if (
				(err.message?.startsWith('Error occurred while trying to proxy') ||
					err.message?.startsWith('Error occured while trying to proxy') ||
					err.message?.includes('http proxy error') ||
					err.message?.startsWith('Gateway Timeout') ||
					err.status == 500) &&
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