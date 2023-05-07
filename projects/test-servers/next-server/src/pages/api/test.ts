// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { remult } from 'remult'
import api from './[...remult]'
import { Task } from '../../shared/Task'

export default api.handle(async (req, res) => {
  res.json({ result: await remult.repo(Task).count() })
})

