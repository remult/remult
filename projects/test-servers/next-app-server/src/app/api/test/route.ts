import { NextResponse } from "next/server";
import { remult } from "remult";
import { Task } from "../../../shared/task";
import { withRemult } from "../[...remult]/route";


export async function GET(req: Request) {
  return NextResponse.json({
    result: await withRemult(() => remult.repo(Task).count()),
    user: await withRemult(async () => remult.user)
  })
}