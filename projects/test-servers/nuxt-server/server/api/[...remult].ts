import { remultApi } from 'remult/remult-nuxt'
import { Task } from '~/shared/Task.js'
import { Module } from 'remult/server'
import { remult } from 'remult'

const initRequestModule = new Module({
  key: 'init-request-module',
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

export const api = remultApi({
  entities: [Task],
  admin: true,
  modules: [initRequestModule, someRoutes],
})

export default defineEventHandler(api)
