import type { RequestEvent } from '@sveltejs/kit'
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
  extraRoutes(router) {
    // How to make sure it has the right starting path? (this.options.rootPath) ?
    // Or we should return an array to registered routes ? (so that we can log them also ? like: [remult] /api/tasks)
    router.route('/api/toto').get((req, res) => {
      console.log('extraRoutes api/toto')
      return res.json({ Soooooo: 'Cool!' })
    })
    router.route('/api/toto2').get((req, res) => {
      console.log('extraRoutes /api/toto2')
      return res.json({ Soooooo: 'Cool!2' })
    })
  },

  modules: [
    //
    new Module({
      key: 'some-routes',
      extraRoutes: (router) => {
        router.route('/api/some-routes').get((req, res) => {
          console.log('extraRoutes /api/some-routes')
          return res.json({ Soooooo: 'Cool! some-routes' })
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
