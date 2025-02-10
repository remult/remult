import { type RequestEvent } from '@sveltejs/kit'
import { Task } from '../shared/Task'
import { TasksController } from '../shared/TasksController'
import { remult } from 'remult'
import { Module } from 'remult/server'
import { remultSveltekit } from 'remult/remult-sveltekit'
import path from 'path'
import fs from 'fs'
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
      extraRoutes: ({ add, rootPath }) => {
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
        add('/setCookie').get((req, res) => {
          res.setCookie('res.setCookie', 'Plop')
          res.send(
            '<h1>setCookie</h1><a href="/api/deleteCookie">deleteCookie</a>',
          )
        })
        add('/deleteCookie').get((req, res) => {
          res.deleteCookie('res.setCookie')
          res.send(
            '<h1>deleteCookie</h1><a href="/api/setCookie">setCookie</a>',
          )
        })
        add('/styled*').get((req, res) => {
          const currentHttpBasePath = `${rootPath}/styled`
          const currentFilePath = './src/server/styled'

          const filePath = req.url.pathname.replace(
            currentHttpBasePath,
            currentFilePath,
          )

          if (fs.existsSync(filePath)) {
            if (fs.statSync(filePath).isDirectory()) {
              const content = fs.readFileSync(
                path.join(currentFilePath, 'index.html'),
                'utf-8',
              )
              res.send(content)
              return
            }
            const content = fs.readFileSync(filePath, 'utf-8')

            const seg = req.url.pathname.split('.')
            const map: Record<string, string> = {
              js: 'text/javascript',
              css: 'text/css',
              svg: 'image/svg+xml',
              html: 'text/html',
            }

            res.send(content, {
              'content-type': map[seg[seg.length - 1]] ?? 'text/plain',
            })
            return
          }

          // 404 not found!
          res.send('')
        })

        // addStaticFolder('/ff*', './src/server/static')
        add('/ff*').get((req, res) => {
          const currentHttpBasePath = `${rootPath}/ff`
          const currentFilePath = './src/server/static'

          let filePath = req.url.pathname.replace(
            currentHttpBasePath,
            currentFilePath,
          )

          if (fs.existsSync(filePath)) {
            if (fs.statSync(filePath).isDirectory()) {
              const isIndexHtml = path.join(filePath, 'index.html')
              if (!fs.existsSync(isIndexHtml)) {
                filePath = filePath + '.html'
              } else {
                filePath = isIndexHtml
              }
            }
          } else {
            filePath = filePath + '.html'
          }

          try {
            const content = fs.readFileSync(filePath, 'utf-8')

            const seg = filePath.split('.')
            const map: Record<string, string> = {
              js: 'text/javascript',
              css: 'text/css',
              svg: 'image/svg+xml',
              html: 'text/html',
            }

            res.send(content, {
              'content-type': map[seg[seg.length - 1]] ?? 'text/plain',
            })
            return
          } catch (error) {}

          res.status(404)
          res.send('')
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
