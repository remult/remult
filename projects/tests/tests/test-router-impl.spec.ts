import { describe, expect, it } from 'vitest'
import {
  type GenericRequestInfo,
  RouteImplementation,
} from '../../core/server/remult-api-server'
describe('test router impl', async () => {
  it('test a', async () => {
    const r = new RouteImplementation<GenericRequestInfo>({
      buildGenericRequestInfo: (req) => {
        return { internal: req, public: { headers: new Headers() } }
      },
      getRequestBody: (req) => {
        return undefined!
      },
    })
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
      await r.handle({
        url: '/a/sdgbsdfgbfds%2Csdfgsdfgbs',
        method: 'GET',
      }),
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
    const r = new RouteImplementation<GenericRequestInfo>({
      buildGenericRequestInfo: (req) => {
        return { internal: req, public: { headers: new Headers() } }
      },
      getRequestBody: (req) => {
        return undefined!
      },
    })
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
    expect(
      await r.handle({
        url: '/aBc/123',
        method: 'GET',
      }),
    ).toMatchInlineSnapshot(`
        {
          "data": {
            "id": "123",
          },
          "statusCode": 200,
        }
      `)
    expect(
      await r.handle({
        url: '/aBc/sdgbsdfgbfds%2Csdfgsdfgbs',
        method: 'GET',
      }),
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
    const r = new RouteImplementation<GenericRequestInfo>({
      buildGenericRequestInfo: (req) => {
        return { internal: req, public: { headers: new Headers() } }
      },
      getRequestBody: (req) => {
        return undefined!
      },
    })
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
    expect(
      await r.handle({
        url: '/a/tasks',
        method: 'GET',
      }),
    ).toMatchInlineSnapshot(`
      {
        "data": {
          "ok": true,
        },
        "statusCode": 200,
      }
    `)
  })
})
