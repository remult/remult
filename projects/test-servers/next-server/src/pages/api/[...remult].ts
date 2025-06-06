import { remultNext } from 'remult/remult-next'
import { Task } from '../../shared/Task'
import { Module } from 'remult/server'

// TODO JYC: to remove and use only the non dist ? (failing for next!)
const someRoutes = new Module({
  key: 'some-routes',
  rawRoutes: ({ add, rootPath }) => {
    const COOKIE_NAME = 'the_cookie_name'
    const cookieNav = `<hr /> <a href="/api/setCookie">setCookie</a> | <a href="/api/getCookie">getCookie</a> | <a href="/api/deleteCookie">deleteCookie</a>`

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
      res.setCookie(COOKIE_NAME, 'Hello')
      res.send(`<h1>setCookie</h1> ${cookieNav}`)
    })

    add('/getCookie').get((req, res) => {
      const val = res.getCookie(COOKIE_NAME)
      res.send(`<h1>getCookie</h1><p>${val}</p> ${cookieNav}`)
    })

    add('/deleteCookie').get((req, res) => {
      res.deleteCookie(COOKIE_NAME)
      res.send(`<h1>deleteCookie</h1> ${cookieNav}`)
    })

    add('/styled*').staticFolder('./src/server/styled', {
      // packageName: 'jyc-pck',
      editFile(filePath, content) {
        if (filePath.endsWith('index.html')) {
          return content.replace('<b>Styled</b>', '<b>Styled Replaced!</b>')
        }
        return content
      },
    })
  },
})

const api = remultNext({
  entities: [Task],
  admin: true,
  modules: [someRoutes as any],
})

export default api
