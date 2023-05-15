import { remultSveltekit } from "remult/remult-sveltekit";
import { Task } from "./shared/task";
import { TasksController } from "./shared/tasksController";
import type { UserInfo } from "remult";

export const api = remultSveltekit({
  entities: [Task],
  controllers: [TasksController],
  getUser: async (event) =>
    (await event?.locals?.getSession())?.user as UserInfo,
})