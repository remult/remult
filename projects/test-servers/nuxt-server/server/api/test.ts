import { remult } from 'remult'
import { api } from './[...remult].js'
import { Task } from '../../../shared/modules/task/Task.js'

export default defineEventHandler(async (event) => {
  return api.withRemult(event, async () => {
    return { result: await remult.repo(Task).count() }
  })
})
