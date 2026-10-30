import { describe, expect, it } from 'vitest'
import {
  Entity,
  Fields,
  InMemoryDataProvider,
  Remult,
  describeClass,
} from '../../../core'
import {
  createRemultServer,
  type GenericRequestInfo,
  type GenericResponse,
} from '../../../core/server/index.js'

async function request(
  method: 'GET' | 'POST',
  filter = '',
  allowApiRead = true,
  action = 'groupBy',
) {
  class Item {
    id = 0
    title = ''
  }
  describeClass(Item, Entity('groupByGetItems', { allowApiRead }), {
    id: Fields.integer(),
    title: Fields.string(),
  })
  const dataProvider = new InMemoryDataProvider()
  const remult = new Remult(dataProvider)
  await remult.repo(Item).insert([
    { id: 1, title: 'first' },
    { id: 2, title: 'second' },
  ])
  const api = createRemultServer<GenericRequestInfo & { body?: unknown }>({
    entities: [Item],
    dataProvider,
    logApiEndPoints: false,
  })
  const observer: GenericResponse = {
    json(data) {
      // Observe invalid Promise responses so a rejected response does not leak.
      // The actual response below is still checked without awaiting its data.
      if (data instanceof Promise) void data.catch(() => undefined)
    },
    status() {
      return this
    },
    end() {},
    send() {},
  }
  return api.handle(
    {
      method,
      url: `/api/groupByGetItems?__action=${action}${filter}`,
      body: method === 'POST' ? {} : undefined,
    },
    observer,
  )
}

describe('groupBy HTTP responses', () => {
  it('GET returns the resolved aggregate', async () => {
    expect(await request('GET')).toEqual({
      statusCode: 200,
      data: [{ $count: 2 }],
    })
  })

  it('GET applies request filters to the aggregate', async () => {
    expect(await request('GET', '&id=1')).toEqual({
      statusCode: 200,
      data: [{ $count: 1 }],
    })
  })

  it('POST returns the resolved aggregate', async () => {
    expect(await request('POST')).toEqual({
      statusCode: 200,
      data: [{ $count: 2 }],
    })
  })

  it('GET count keeps returning its normal response', async () => {
    expect(await request('GET', '', true, 'count')).toEqual({
      statusCode: 200,
      data: { count: 2 },
    })
  })

  it.each(['GET', 'POST'] as const)(
    '%s returns a forbidden response when API reads are denied',
    async (method) => {
      expect(await request(method, '', false)).toEqual({
        statusCode: 403,
        data: { message: 'Forbidden' },
      })
    },
  )
})
