import path from 'path'
import fs from 'fs'
import { Module } from '../../../core/server/index.js'

export const someRoutes = new Module({
  key: 'some-routes',
  rawRoutes: ({ add, rootPath }) => {
    // To move in remult ?! add in rawRoutes args ?
    function addStaticFolder(
      add: any,
      rootPath: string,
      urlPath: string,
      folderPath: string,
    ) {
      add(urlPath).get((req: any, res: any) => {
        const currentHttpBasePath = `${rootPath}${urlPath.replace('*', '')}`
        const currentFilePath = folderPath

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

        res.status(404).end()
      })
    }

    add('/new-route').get((req, res) => {
      res.json({ Soooooo: 'Cool! A new new-route!' })
    })
    add('/html').get((req, res) => {
      res.send('<h1>Hello World</h1>')
    })
    add('/redirect').get((req, res) => {
      // res.status(302).redirect('/api/html')
      res.redirect('/api/html')
    })
    add('/redirect-ext').get((req, res) => {
      res.redirect(
        'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#redirection_messages',
      )
    })
    add('/setCookie').get((req, res) => {
      res.setCookie('res.setCookie', 'Plop')
      res.send(
        '<h1>setCookie</h1><a href="/api/setCookie">setCookie</a> | <a href="/api/getCookie">getCookie</a> | <a href="/api/deleteCookie">deleteCookie</a>',
      )
    })
    add('/getCookie').get((req, res) => {
      const val = res.getCookie('res.setCookie')
      res.send(
        `<h1>getCookie</h1><p>${val}</p><a href="/api/setCookie">setCookie</a> | <a href="/api/getCookie">getCookie</a> | <a href="/api/deleteCookie">deleteCookie</a>`,
      )
    })
    add('/deleteCookie').get((req, res) => {
      res.deleteCookie('res.setCookie')
      res.send(
        '<h1>deleteCookie</h1><a href="/api/setCookie">setCookie</a> | <a href="/api/getCookie">getCookie</a> | <a href="/api/deleteCookie">deleteCookie</a>',
      )
    })

    addStaticFolder(add, rootPath, '/styled*', './src/server/styled')
  },
})
