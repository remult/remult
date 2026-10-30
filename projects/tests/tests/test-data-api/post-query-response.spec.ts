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

const nextTurn = () => new Promise<void>((resolve) => setImmediate(resolve))

async function request({
  allowApiRead = true,
  failFilter = false,
  delayError = false,
  where = {},
}: {
  allowApiRead?: boolean
  failFilter?: boolean
  delayError?: boolean
  where?: { id?: number }
} = {}) {
  class Item {
    id = 0
    title = ''
  }
  describeClass(
    Item,
    Entity('queryResponseItems', {
      allowApiRead,
      apiPrefilter: () => {
        if (failFilter) throw new Error('filter failed')
        return {}
      },
    }),
    { id: Fields.integer(), title: Fields.string() },
  )
  const dataProvider = new InMemoryDataProvider()
  const remult = new Remult(dataProvider)
  await remult.repo(Item).insert([
    { id: 1, title: 'first' },
    { id: 2, title: 'second' },
  ])
  let signalError = () => {}
  let releaseError = () => {}
  const errorEntered = new Promise<void>((resolve) => (signalError = resolve))
  const errorReleased = new Promise<void>((resolve) => (releaseError = resolve))
  const api = createRemultServer<GenericRequestInfo & { body?: unknown }>({
    entities: [Item],
    dataProvider,
    logApiEndPoints: false,
    error: delayError
      ? async (info) => {
          signalError()
          await errorReleased
          if (failFilter) info.sendError(503, { message: 'custom failure' })
        }
      : undefined,
  })
  const responses: { statusCode: number; data: unknown }[] = []
  let statusCode = 200
  const observer: GenericResponse = {
    json(data) {
      responses.push({ statusCode, data })
    },
    status(value) {
      statusCode = value
      return this
    },
    end() {},
    send() {},
  }
  const pending = api.handle(
    {
      method: 'POST',
      url: '/api/queryResponseItems?__action=query',
      body: { where, aggregate: {} },
    },
    observer,
  )
  let earlyResponses = responses.slice()
  if (delayError) {
    try {
      await errorEntered
      await nextTurn()
      earlyResponses = responses.slice()
    } finally {
      releaseError()
    }
  }
  const result = await pending
  // Drain response callbacks so duplicate writes cannot hide behind handle().
  await nextTurn()
  return { result, responses, earlyResponses }
}

describe('POST query responses', () => {
  it('sends only one forbidden response when API reads are denied', async () => {
    const { result, responses } = await request({ allowApiRead: false })
    const expected = { statusCode: 403, data: { message: 'Forbidden' } }
    expect(result).toEqual(expected)
    expect(responses).toEqual([expected])
  })

  it('waits for an asynchronous forbidden error handler', async () => {
    const { result, responses, earlyResponses } = await request({
      allowApiRead: false,
      delayError: true,
    })
    expect(earlyResponses).toEqual([])
    const expected = { statusCode: 403, data: { message: 'Forbidden' } }
    expect(result).toEqual(expected)
    expect(responses).toEqual([expected])
  })

  it('preserves a custom asynchronous error response when a filter fails', async () => {
    const { result, responses, earlyResponses } = await request({
      failFilter: true,
      delayError: true,
    })
    expect(earlyResponses).toEqual([])
    const expected = { statusCode: 503, data: { message: 'custom failure' } }
    expect(result).toEqual(expected)
    expect(responses).toEqual([expected])
  })

  it('returns items and aggregates for an allowed query', async () => {
    const { result, responses } = await request()
    const expected = {
      statusCode: 200,
      data: {
        items: [
          { id: 1, title: 'first' },
          { id: 2, title: 'second' },
        ],
        aggregates: { $count: 2 },
      },
    }
    expect(result).toEqual(expected)
    expect(responses).toEqual([expected])
  })

  it('applies filters to both items and aggregates', async () => {
    const { result, responses } = await request({ where: { id: 1 } })
    const expected = {
      statusCode: 200,
      data: {
        items: [{ id: 1, title: 'first' }],
        aggregates: { $count: 1 },
      },
    }
    expect(result).toEqual(expected)
    expect(responses).toEqual([expected])
  })
})
