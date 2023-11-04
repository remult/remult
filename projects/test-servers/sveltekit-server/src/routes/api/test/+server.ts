import { json } from '@sveltejs/kit'
import { remult } from 'remult'
import { Task } from '../../../shared/Task'

export const GET = async () => {
  return json({ result: await remult.repo(Task).count() })
}
