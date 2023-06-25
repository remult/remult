import { NextResponse } from "next/server"
import { remult } from "remult"
import { Task } from "../../../shared/task"
import { withRemult } from "../[...remult]/route"

export async function GET(req: Request) {
  return withRemult(async () => {
    return NextResponse.json({
      result: await remult.repo(Task).count(),
      user: remult.user
    })
  })
}
