import { remult } from 'remult'
import { Task } from '~/shared/Task.js'
import { api } from './[...remult].js'

export default defineEventHandler(async (event) => {
  return api.withRemult(event, async () => {
    return { result: await remult.repo(Task).count() }
  })
})
