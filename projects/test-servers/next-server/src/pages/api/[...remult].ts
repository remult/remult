import { remultNext } from 'remult/remult-next'
import { Task } from '../../shared/Task'
import { Module } from 'remult/server'

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

    '/post-body-add': {
      POST: async ({ res, req }) => {
        const oldValue = (req.body as { count: number }).count
        res.json({
          newCount: oldValue + 1,
          oldValue,
        })
      },
    },
  },
})

export default remultNext({
  entities: [Task],
  admin: true,
  modules: [someRoutes as any],
})
