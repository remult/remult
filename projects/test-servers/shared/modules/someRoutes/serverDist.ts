// JYC TODO: to remove and use only the non dist ? (failing for nuxt!)
import { Module } from 'remult/server'

export const someRoutes = new Module({
  key: 'some-routes',
  rawRoutes: ({ add, rootPath }) => {
    const COOKIE_NAME = 'the_cookie_name'
    const cookieNav = `<hr /> <a href="/api/setCookie">setCookie</a> | <a href="/api/getCookie">getCookie</a> | <a href="/api/deleteCookie">deleteCookie</a>`

    add('/new-route').get((req, res) => {
      res.json({ Soooooo: 'Cool! A new new-route!' })
    })

    add('/crash-test').get((req, res) => {
      throw new Error('Server crash test')
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
      const val = 'Hello'
      res.setCookie(COOKIE_NAME, val)
      res.send(`<h1>setCookie</h1><p>set: ${val}</p> ${cookieNav}`)
    })

    add('/setCookieStrict').get((req, res) => {
      const val = 'Hello'
      res.setCookie(COOKIE_NAME, val, { sameSite: 'strict' })
      res.send(`<h1>setCookie</h1><p>set: ${val}</p> ${cookieNav}`)
    })

    add('/getCookie').get((req, res) => {
      const val = res.getCookie(COOKIE_NAME)
      res.send(`<h1>getCookie</h1><p>get: ${val}</p> ${cookieNav}`)
    })

    add('/deleteCookie').get((req, res) => {
      res.deleteCookie(COOKIE_NAME)
      res.send(`<h1>deleteCookie</h1><p>deleted</p> ${cookieNav}`)
    })

    add('/styled*').staticFolder('../shared/modules/someRoutes/styled', {
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
