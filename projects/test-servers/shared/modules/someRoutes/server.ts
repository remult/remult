import path from 'path'
import { Module } from '../../../../core/server/Module.js'

/**
 * in next-server, we need to copy the same module... here is the link!
 *
 * Here is the [file to edit](../../../next-server/src/pages/api/[...remult].ts)
 *
 * I would love to have only THIS module to test, all server are working except next-server...!
 */
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
      const { redirect } = res
      redirect(
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

    add('/setHeader').get(({ res, setHeaders }) => {
      setHeaders({ 'x-test-header': 'Hello' })
      res.send(`<h1>setHeader</h1>`)
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

    add('/post-headers').post(({ res, req }) => {
      res.json({ reqHeaders: req?.headers['hello'] })
    })
  },
})
