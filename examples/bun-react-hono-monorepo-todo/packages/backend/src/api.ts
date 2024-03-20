import { remultHono } from "remult/remult-hono";
import { TasksController } from "shared";

export const api = remultHono({
  controllers: [TasksController],
  getUser: async (c: any) => {
    const session = c.get("session");
    return session.get("user");
  },
});
