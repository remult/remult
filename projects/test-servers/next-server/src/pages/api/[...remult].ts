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

    '/crash-test': () => {
      throw new Error('Server crash test')
    },

    '/html': ({ res }) => {
      res.send('<h1>Hello World</h1>')
    },

    '/get-headers': ({ res, req }) => {
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

    '/redirect': ({ res }) => {
      res.redirect('/api/html')
    },

    '/redirect-ext': ({ res }) => {
      const { redirect } = res
      redirect(
        'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#redirection_messages',
      )
    },
  },
})

export default remultNext({
  entities: [Task],
  admin: true,
  modules: [someRoutes as any],
})
