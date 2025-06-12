import { describe, expect, it } from 'vitest'
import { getBaseTypicalRouteInfo } from '../../core/server/route-helpers.js'

describe('route-helpers', () => {
  describe('url', () => {
    it('should have a valid url', () => {
      const tri = getBaseTypicalRouteInfo({ url: 'https://remult.dev/' })
      expect(tri.req?.url?.toString()).toMatchInlineSnapshot(
        `"https://remult.dev/"`,
      )
    })

    it('should be undefined as url is not valid', () => {
      const tri = getBaseTypicalRouteInfo({ url: '/a' })
      expect(tri.req?.url).toBeUndefined()
    })
  })

  describe('headers', () => {
    it('should have a valid headers', () => {
      const tri = getBaseTypicalRouteInfo({
        headers: { 'x-test-header': 'Hello' },
      })
      expect(tri.req?.headers['x-test-header']).toBe('Hello')
    })

    it('should have a valid headers', () => {
      const headers = new Headers()
      headers.append('x-test-header', 'Hello')
      const tri = getBaseTypicalRouteInfo({
        headers,
      })
      expect(tri.req?.headers['x-test-header']).toBe('Hello')
    })
  })

  describe('cookie', () => {
    it('should not return anything', () => {
      const tri = getBaseTypicalRouteInfo({})
      expect(tri.cookie('test').get()).toBeUndefined()
    })

    it('should have 3 keys', () => {
      const tri = getBaseTypicalRouteInfo({})
      expect(Object.keys(tri.cookie('test'))).toMatchInlineSnapshot(`
        [
          "set",
          "get",
          "delete",
        ]
      `)
    })
  })

  describe('res loop with status', () => {
    it('should not return anything', () => {
      const tri = getBaseTypicalRouteInfo({})
      expect(Object.keys(tri.res.status(200))).toMatchInlineSnapshot(`
        [
          "end",
          "json",
          "send",
          "redirect",
          "status",
        ]
      `)
    })
  })
})
