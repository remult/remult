import { NextResponse } from 'next/server'
import { remult } from 'remult'
import { Task } from '../../../shared/task'
import { api } from '../../../api'

export async function GET(req: Request) {
  return api.withRemult(async () => {
    return NextResponse.json({
      result: await remult.repo(Task).count(),
      user: remult.user,
    })
  })
}
