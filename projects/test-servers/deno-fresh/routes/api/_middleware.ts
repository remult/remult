// routes/_middleware.ts

import { remultFresh } from 'remult/remult-fresh'
import { Task } from '../../shared/task.ts'

export const api = remultFresh(
  {
    entities: [Task],
  },
  Response,
)

export const handler = api.handle
// export function handler(
//   req: Request, ctx: MiddlewareHandlerContext
// ) {
//   return api.freshHandler(req, ctx);
// }
