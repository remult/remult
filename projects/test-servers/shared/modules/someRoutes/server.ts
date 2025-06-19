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
        res.json({ 'new-route-2': req.url?.searchParams.get('param') })
      },
    },

    '/crash-test': async () => {
      throw new Error('Server crash test')
    },

    '/html': async ({ res }) => {
      res.send('<h1>Hello World</h1>')
    },

    '/get-headers': async ({ res, req }) => {
      res.json({ reqHeaders: req.headers?.hello })
    },

    '/post-headers': {
      POST: async ({ res, req }) => {
        res.json({ reqHeaders: req.headers?.hello })
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

    '/redirect': async ({ res }) => {
      res.redirect('/api/html')
    },

    '/redirect-ext': async ({ res }) => {
      const { redirect } = res
      redirect(
        'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#redirection_messages',
      )
    },
  },
})
