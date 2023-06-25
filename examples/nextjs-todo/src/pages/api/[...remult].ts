import { remultNext } from "remult/remult-next"
import { findUserById } from "./auth/[...nextauth]"
import { getToken } from "next-auth/jwt"
import { Task } from "../../shared/task"
import { TasksController } from "../../shared/tasksController"

export default remultNext({
  entities: [Task],
  controllers: [TasksController],
  getUser: async (req) => findUserById((await getToken({ req }))?.sub)
})
