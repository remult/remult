import { type RequestEvent } from '@sveltejs/kit'
import { Task } from '../shared/Task'
import { TasksController } from '../shared/TasksController'
import { remult } from 'remult'
import { Module } from 'remult/server'
import { remultSveltekit } from 'remult/remult-sveltekit'

export const api = remultSveltekit({
  entities: [Task],
  controllers: [TasksController],
  admin: true,
  initRequest: async (event) => {
    remult.context.setHeaders = (headers) => {
      event.setHeaders(headers)
    }
    remult.context.setCookie = (name, value) => {
      event.cookies.set(name, value, { path: '.' })
    }
  },
  initApi: (api) => {
    console.log('Ready 💪')
  },

  modules: [
    new Module({
      key: 'some-routes',
      extraRoutes: (add) => {
        add('/new-route').get((req, res) => {
          console.log('extraRoutes /api/new-route')
          res.json({ Soooooo: 'Cool! A new new-route!' })
        })
        add('/html').get((req, res) => {
          res.send('<h1>Hello World</h1>')
        })
        add('/redirect').get((req, res) => {
          res.redirect(307, '/api/html')
        })
        add('/redirect-ext').get((req, res) => {
          res.redirect(
            307,
            'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#redirection_messages',
          )
        })
      },
    }),
  ],
})

declare module 'remult' {
  export interface RemultContext {
    setHeaders(headers: Record<string, string>): void
    setCookie(...args: Parameters<RequestEvent['cookies']['set']>): void
  }
}
