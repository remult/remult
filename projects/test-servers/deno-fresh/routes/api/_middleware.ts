// routes/_middleware.ts

import { remultFresh } from 'remult/remult-fresh'
import { Task } from '../../shared/task.js'
import { someRoutes } from '../../../shared/modules/someRoutes/server.js'

export const api = remultFresh(
  {
    entities: [Task],
    admin: true,
    modules: [someRoutes],
  },
  Response,
)

export const handler = api.handle
// export function handler(
//   req: Request, ctx: MiddlewareHandlerContext
// ) {
//   return api.freshHandler(req, ctx);
// }
