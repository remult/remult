import { NextResponse } from 'next/server'
import { remult } from 'remult'
import { Task } from '../../../shared/task'
import { api } from '../[...remult]/api'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  return NextResponse.json({
    result: await api.withRemult(() => remult.repo(Task).count()),
    user: await api.withRemult(async () => remult.user),
  })
}
