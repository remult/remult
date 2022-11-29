// routes/_middleware.ts
import { MiddlewareHandlerContext } from "$fresh/server.ts";

import { Task } from "../../shared/task.ts";
import { remultFresh } from "remult/remult-fresh";

export const api = remultFresh({
  entities: [Task],
}, Response);
console.log(api);


export const handler = api.freshHandler;
// export function handler(
//   req: Request, ctx: MiddlewareHandlerContext
// ) {
//   return api.freshHandler(req, ctx);
// }
