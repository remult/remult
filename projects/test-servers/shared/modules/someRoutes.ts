import path from 'path'
import fs from 'fs'
import { Module } from '../../../core/server/index.js'

export const someRoutes = new Module({
  key: 'some-routes',
  rawRoutes: ({ add, rootPath }) => {
    add('/new-route').get((req, res) => {
      res.json({ Soooooo: 'Cool! A new new-route!' })
    })

    add('/html').get((req, res) => {
      res.send('<h1>Hello World</h1>')
    })

    add('/redirect').get((req, res) => {
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

    add('/styled*').staticFolder('./src/server/styled', {
      // packageName: 'coucou',
      editFile(filePath, content) {
        if (filePath.endsWith('index.html')) {
          return content.replace('<b>Styled</b>', '<b>Styled Replaced!</b>')
        }
        return content
      },
    })
  },
})
