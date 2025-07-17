import { remultNext } from 'remult/remult-next'
import { Task } from '../../shared/Task'
import { Module } from 'remult/server'
import { remult } from 'remult'

const initRequestModule = new Module({
  key: 'init-request-module-next',
  async initRequest() {
    if (remult.context.headers?.get('remult-test-crash-ctx') === 'yes-c') {
      throw new Error('test crash')
    }
  },
})

const someRoutes = new Module({
  key: 'some-routes',
  routes: {
    '/new-route': async ({ res, req }) => {
      res.json({ Soooooo: 'Cool! A new new-route!' })
    },

    '/new-route-2': {
      GET: async ({ res, req }) => {
        res.json({ 'new-route-2': req.url?.searchParams.get('param') })
      },
    },
  },
})

export default remultNext({
  entities: [Task],
  admin: true,
  modules: [initRequestModule, someRoutes],
})
