// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { remult } from 'remult'
import { Task } from '../../shared/Task'
import api from './[...remult]'

export default api.handle(async (req, res) => {
  res.json({ result: await remult.repo(Task).count() })
})
