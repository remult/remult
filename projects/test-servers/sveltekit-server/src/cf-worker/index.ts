/// <reference types="@cloudflare/workers-types" />

// import { createD1HttpDataProvider } from 'remult/remult-d1-http'
// import { Task } from '../shared/Task'
// import { TasksController } from '../shared/TasksController'
// import {  } from 'remult/remult-d1-http'

export default {
	async fetch(request: Request, env: any, ctx: ExecutionContext) {
		return {}
		// const api = remultApi({
		// 	entities: [Task],
		// 	controllers: [TasksController],
		// 	admin: true,
		// 	initRequest: async () => {
		// 		remult.context.setHeaders = (headers) => {
		// 			Object.entries(headers).forEach(([key, value]) => {
		// 				request.headers.set(key, value)
		// 			})
		// 		}
		// 	}
		// })

		// return api.handle(request)
	}
}
