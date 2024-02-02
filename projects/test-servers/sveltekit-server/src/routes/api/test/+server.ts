import { json, type RequestHandler } from '@sveltejs/kit'
import { remult } from 'remult'
import { Task } from '../../../shared/Task'
import { _api } from '../[...remult]/+server'

export const GET: RequestHandler = async (event) => {
  return _api.withRemult(event, async () =>
    json({ result: await remult.repo(Task).count() }),
  )
}
