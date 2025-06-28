import { remultNext } from 'remult/remult-next'
import { Task } from '../../shared/Task'
import { Module } from 'remult/server'
import { remult } from 'remult'

const initRequestModule = new Module({
  key: 'init-request-module-next',
  async initRequest() {
    if (remult.context._?.headers.get('remult-test-crash-ctx') === 'yes-c') {
      throw new Error('test crash')
    }
  },
})

export default remultNext({
  entities: [Task],
  admin: true,
  modules: [initRequestModule],
})
