import { Module } from '../../../../core/server/module.js'

/**
 * in next-server, we need to copy the same module...
 *
 * Here is the [file to edit](../../../next-server/src/pages/api/[...remult].ts)
 *
 * I would love to have only THIS module to test, all server are working except next-server...!
 * Maybe the shared modules should be in next-server!
 */
export const someRoutes = new Module({
  key: 'some-routes',
  routes: {
    '/new-route': async ({ res, req }) => {
      res.json({ Soooooo: 'Cool! A new new-route!' })
    },

    '/new-route-2': {
      GET: async ({ res, req }) => {
        res.json({ 'new-route-2': req.url.searchParams.get('param') })
      },
    },

    '/new-route-host': {
      GET: async ({ res, req }) => {
        res.json({ host: req.url.host })
      },
    },
  },
})
