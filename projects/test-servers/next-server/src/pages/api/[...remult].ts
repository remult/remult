import { remultNext } from 'remult/remult-next'
import { Task } from '../../shared/Task'
import { Module } from 'remult/server'

const initRequestModule = new Module({
  key: 'init-request-module',
  async initRequest(_, { req }) {
    if (req.headers.get('remult-test-crash') === 'yes') {
      throw new Error('test crash')
    }
  },
})

export default remultNext({
  entities: [Task],
  admin: true,
  modules: [initRequestModule],
})
