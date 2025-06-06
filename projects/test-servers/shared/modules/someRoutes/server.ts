import path from 'path'
import { Module } from '../../../../core/server/index.js'
// JYC TODO: remove `projects/test-servers/shared/modules/someRoutes/serverDist.ts`
// JYC TODO: remove someRoutes in `projects/test-servers/next-server/src/pages/api/[...remult].ts`

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

    const rootRepo = process.cwd().split('projects/test-servers')
    const pathStatic = path.join(
      rootRepo[0],
      'projects/test-servers/shared/modules/someRoutes/styled',
    )

    add('/styled*').staticFolder(pathStatic, {
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
