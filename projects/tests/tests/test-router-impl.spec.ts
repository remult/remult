import { describe, expect, it, beforeEach } from 'vitest'
import {
  type GenericRequestInfo,
  RouteImplementation,
} from '../../core/server/remult-api-server'

describe('test router impl', async () => {
  let r: RouteImplementation<GenericRequestInfo>

  beforeEach(() => {
    r = new RouteImplementation<GenericRequestInfo>({
      buildGenericRequestInfo: (req) => {
        return req
      },
      getRequestBody: (req) => {
        return undefined!
      },
    })
  })

  it('test a', async () => {
    let result: any = {}
    r.route('/a').get(async (req, res) => {
      result.getWorks = true
      res.json({ ok: true })
      res.end()
    })
    r.route('/a/:id').get(async (req, res) => {
      res.json(req.params)
    })

    expect(await r.handle({ url: '/a', method: 'GET' })).toMatchInlineSnapshot(`
      {
        "data": {
          "ok": true,
        },
        "statusCode": 200,
      }
    `)
    expect(await r.handle({ url: '/a/123', method: 'GET' }))
      .toMatchInlineSnapshot(`
        {
          "data": {
            "id": "123",
          },
          "statusCode": 200,
        }
      `)
    expect(
      await r.handle({ url: '/a/sdgbsdfgbfds%2Csdfgsdfgbs', method: 'GET' }),
    ).toMatchInlineSnapshot(`
      {
        "data": {
          "id": "sdgbsdfgbfds,sdfgsdfgbs",
        },
        "statusCode": 200,
      }
    `)
  })
  it('test b', async () => {
    let result: any = {}
    r.route('/aBc').get(async (req, res) => {
      result.getWorks = true
      res.json({ ok: true })
      res.end()
    })
    r.route('/aBc/:id').get(async (req, res) => {
      res.json(req.params)
    })

    expect(await r.handle({ url: '/aBc', method: 'GET' }))
      .toMatchInlineSnapshot(`
      {
        "data": {
          "ok": true,
        },
        "statusCode": 200,
      }
    `)
    expect(await r.handle({ url: '/aBc/123', method: 'GET' }))
      .toMatchInlineSnapshot(`
        {
          "data": {
            "id": "123",
          },
          "statusCode": 200,
        }
      `)
    expect(
      await r.handle({ url: '/aBc/sdgbsdfgbfds%2Csdfgsdfgbs', method: 'GET' }),
    ).toMatchInlineSnapshot(`
      {
        "data": {
          "id": "sdgbsdfgbfds,sdfgsdfgbs",
        },
        "statusCode": 200,
      }
    `)
  })
  it('test *', async () => {
    let result: any = {}
    r.route('/a*').get(async (req, res) => {
      result.getWorks = true
      res.json({ ok: true })
      res.end()
    })

    expect(await r.handle({ url: '/a', method: 'GET' })).toMatchInlineSnapshot(`
      {
        "data": {
          "ok": true,
        },
        "statusCode": 200,
      }
    `)
    expect(await r.handle({ url: '/a/', method: 'GET' }))
      .toMatchInlineSnapshot(`
    {
      "data": {
        "ok": true,
      },
      "statusCode": 200,
    }
  `)
    expect(await r.handle({ url: '/a/tasks', method: 'GET' }))
      .toMatchInlineSnapshot(`
      {
        "data": {
          "ok": true,
        },
        "statusCode": 200,
      }
    `)
  })
  it('test 404', async () => {
    r.route('/a').get(async (req, res) => {
      res.status(404).end()
    })
    expect(await r.handle({ url: '/a', method: 'GET' })).toMatchInlineSnapshot(`
      {
        "statusCode": 404,
      }
    `)
  })
  it('test send html', async () => {
    r.route('/a').get(async (req, res) => {
      res.send(`<h1>hello</h1>`)
    })
    expect(await r.handle({ url: '/a', method: 'GET' })).toMatchInlineSnapshot(`
      {
        "content": "<h1>hello</h1>",
        "headers": {
          "Content-Type": "text/html",
        },
        "statusCode": 200,
      }
    `)
  })
  it('test send js', async () => {
    r.route('/b').get(async (req, res) => {
      res.send(`console.log('hello')`, { 'Content-Type': 'text/javascript' })
    })
    expect(await r.handle({ url: '/b', method: 'GET' })).toMatchInlineSnapshot(`
      {
        "content": "console.log('hello')",
        "headers": {
          "Content-Type": "text/javascript",
        },
        "statusCode": 200,
      }
    `)
  })
  it('test redirect', async () => {
    r.route('/r').get(async (req, res) => {
      res.redirect('/a')
    })
    expect(await r.handle({ url: '/r', method: 'GET' })).toMatchInlineSnapshot(`
      {
        "redirectUrl": "/a",
        "statusCode": 307,
      }
    `)
    expect(await r.handle({ url: '/a', method: 'GET' })).toMatchInlineSnapshot(
      `undefined`,
    )
  })
  it('test redirect with code', async () => {
    r.route('/r').get(async (req, res) => {
      res.status(302).redirect('/a')
    })
    expect(await r.handle({ url: '/r', method: 'GET' })).toMatchInlineSnapshot(`
      {
        "redirectUrl": "/a",
        "statusCode": 302,
      }
    `)
  })
})
