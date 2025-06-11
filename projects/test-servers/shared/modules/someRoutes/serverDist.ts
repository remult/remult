// TODO JYC: to remove and use only the non dist ? (failing for nuxt!)
import path from 'path'
import { Module } from 'remult/server'

export const someRoutes = new Module({
  key: 'some-routes',
  routes: ({ add, rootPath }) => {
    const COOKIE_NAME = 'the_cookie_name'
    const cookieNav = `<hr /> <a href="/api/setCookie">setCookie</a> | <a href="/api/getCookie">getCookie</a> | <a href="/api/deleteCookie">deleteCookie</a>`

    add('/new-route').get(({ res }) => {
      res.json({ Soooooo: 'Cool! A new new-route!' })
    })

    add('/crash-test').get(() => {
      throw new Error('Server crash test')
    })

    add('/html').get(({ res }) => {
      res.send('<h1>Hello World</h1>')
    })

    add('/redirect').get(({ res }) => {
      res.redirect('/api/html')
    })

    add('/redirect-ext').get(({ res }) => {
      res.redirect(
        'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#redirection_messages',
      )
    })

    add('/setCookie').get(({ res, cookie }) => {
      const val = 'Hello'
      cookie(COOKIE_NAME).set(val)
      res.send(`<h1>setCookie</h1><p>set: ${val}</p> ${cookieNav}`)
    })

    add('/setCookieStrict').get(({ res, cookie }) => {
      const val = 'Hello'
      cookie(COOKIE_NAME).set(val, { sameSite: 'strict' })
      res.send(`<h1>setCookie</h1><p>set: ${val}</p> ${cookieNav}`)
    })

    add('/getCookie').get(({ res, cookie }) => {
      const val = cookie(COOKIE_NAME).get()
      res.send(`<h1>getCookie</h1><p>get: ${val}</p> ${cookieNav}`)
    })

    add('/deleteCookie').get(({ res, cookie }) => {
      cookie(COOKIE_NAME).delete()
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
