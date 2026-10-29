import { describe, expect, it } from 'vitest'
import { Entity, Fields, InMemoryDataProvider } from '../../../core'
import { Remult } from '../../../core/src/context'
import { DataApi } from '../../../core/src/data-api'
import { TestDataApiResponse } from '../TestDataApiResponse'

@Entity('people', { allowApiCrud: true })
class Person {
  @Fields.string()
  id = ''
  @Fields.string()
  name = ''
  @Fields.string({ includeInApi: false })
  email = ''
  @Fields.string({ includeInApi: 'admin' })
  phone = ''
}

async function setup(roles?: string[]) {
  const remult = new Remult(new InMemoryDataProvider())
  await remult.repo(Person).insert([
    { id: '1', name: 'Ann', email: 'ann@a.com', phone: '+33 1' },
    { id: '2', name: 'Bob', email: 'bob@b.com', phone: '+44 2' },
  ])
  if (roles) remult.user = { id: 'u', roles }
  return remult
}

async function call(
  remult: Remult,
  method: 'get' | 'post',
  params: Record<string, any>,
  body?: any,
) {
  const api = new DataApi(remult.repo(Person), remult)
  const response = new TestDataApiResponse()
  let result: {
    status: 'success' | 'forbidden' | 'error'
    data?: any
  } | undefined
  response.success = (data) => (result = { status: 'success', data })
  response.forbidden = () => (result = { status: 'forbidden' })
  response.error = (data) => (result = { status: 'error', data })
  const req = { get: (key: string) => params[key] }
  if (method === 'get') await api.httpGet(response, req, async () => ({}))
  else await api.httpPost(response, req, body, async () => ({}))
  return result!
}

const names = (r: { data?: any }) => r.data.map((x: any) => x.name)

describe('a where on a field the api hides is ignored', () => {
  it('a readable field still filters', async () => {
    const remult = await setup()
    expect(
      names(await call(remult, 'get', { 'name.startsWith': 'B' })),
    ).toEqual(['Bob'])
  })

  it('GET param filter on includeInApi: false matches a missing field', async () => {
    const remult = await setup()
    const hidden = await call(remult, 'get', { 'email.startsWith': 'bob@' })
    const missing = await call(remult, 'get', { 'noSuch.startsWith': 'bob@' })
    expect(names(hidden)).toEqual(names(missing))
    expect(names(hidden)).toEqual(['Ann', 'Bob'])
  })

  it('a hidden field is dropped and a readable field still applies', async () => {
    const remult = await setup()
    expect(
      names(
        await call(remult, 'get', {
          name: 'Ann',
          'email.startsWith': 'bob@',
        }),
      ),
    ).toEqual(['Ann'])
  })

  it('GET param filter on role-gated field, anonymous', async () => {
    const remult = await setup()
    expect(
      names(await call(remult, 'get', { 'phone.startsWith': '+44' })),
    ).toEqual(['Ann', 'Bob'])
  })

  it('GET param filter on role-gated field, with the role', async () => {
    const remult = await setup(['admin'])
    expect(
      names(await call(remult, 'get', { 'phone.startsWith': '+44' })),
    ).toEqual(['Bob'])
  })

  it('POST body where', async () => {
    const remult = await setup()
    expect(
      names(
        await call(
          remult,
          'post',
          { __action: 'get' },
          { where: { 'email.contains': '@b.' } },
        ),
      ),
    ).toEqual(['Ann', 'Bob'])
  })

  it('nested in OR', async () => {
    const remult = await setup()
    const hidden = await call(
      remult,
      'post',
      { __action: 'get' },
      { where: { OR: [{ 'email.contains': '@b.' }, { name: 'nobody' }] } },
    )
    const missing = await call(
      remult,
      'post',
      { __action: 'get' },
      { where: { OR: [{ 'noSuch.contains': '@b.' }, { name: 'nobody' }] } },
    )
    expect(names(hidden)).toEqual(names(missing))
    expect(names(hidden)).toEqual(['Ann', 'Bob'])
  })

  it('nested in NOT', async () => {
    const remult = await setup()
    const hidden = await call(
      remult,
      'post',
      { __action: 'get' },
      { where: { NOT: [{ 'phone.startsWith': '+33' }] } },
    )
    const missing = await call(
      remult,
      'post',
      { __action: 'get' },
      { where: { NOT: [{ 'noSuch.startsWith': '+33' }] } },
    )
    expect(names(hidden)).toEqual(names(missing))
    expect(names(hidden)).toEqual([])
  })

  it('_sort on a hidden field', async () => {
    const remult = await setup()
    const hidden = await call(remult, 'get', {
      _sort: 'name,email',
      _order: 'asc,desc',
    })
    const missing = await call(remult, 'get', {
      _sort: 'name,noSuch',
      _order: 'asc,desc',
    })
    expect(names(hidden)).toEqual(names(missing))
    expect(names(hidden)).toEqual(['Ann', 'Bob'])
  })

  it('_sort on a role-gated field', async () => {
    expect(
      names(
        await call(await setup(), 'get', { _sort: 'phone', _order: 'desc' }),
      ),
    ).toEqual(['Ann', 'Bob'])
    expect(
      names(
        await call(await setup(['admin']), 'get', {
          _sort: 'phone',
          _order: 'desc',
        }),
      ),
    ).toEqual(['Bob', 'Ann'])
  })

  it('_sort on a readable field', async () => {
    const remult = await setup()
    expect(
      names(await call(remult, 'get', { _sort: 'name', _order: 'desc' })),
    ).toEqual(['Bob', 'Ann'])
  })

  it('count', async () => {
    const remult = await setup()
    expect(
      await call(remult, 'get', {
        __action: 'count',
        'email.startsWith': 'bob@',
      }),
    ).toMatchObject({ status: 'success', data: { count: 2 } })
  })

  it('groupBy where on a hidden field matches a missing field', async () => {
    const remult = await setup()
    const hidden = await call(
      remult,
      'post',
      { __action: 'groupBy' },
      { where: { 'email.startsWith': 'bob@' } },
    )
    const missing = await call(
      remult,
      'post',
      { __action: 'groupBy' },
      { where: { 'noSuch.startsWith': 'bob@' } },
    )
    expect(hidden).toEqual(missing)
    expect(hidden).toMatchObject({ status: 'success', data: [{ $count: 2 }] })
  })

  it('groupBy field lists drop a hidden field like a missing one', async () => {
    const remult = await setup()
    function body(field: string) {
      return {
        groupBy: ['name', field],
        min: [field],
        max: [field],
        distinctCount: [field],
        orderBy: [{ field, isDescending: true }, { field: 'name' }],
      }
    }
    const hidden = await call(remult, 'post', { __action: 'groupBy' }, body('email'))
    const missing = await call(
      remult,
      'post',
      { __action: 'groupBy' },
      body('noSuch'),
    )
    expect(hidden).toEqual(missing)
    expect(hidden.data).toEqual([
      { name: 'Ann', $count: 1 },
      { name: 'Bob', $count: 1 },
    ])
  })

  it('groupBy orderBy count still sorts', async () => {
    const remult = await setup()
    await remult.repo(Person).insert({
      id: '3',
      name: 'Ann',
      email: 'ann2@a.com',
      phone: '+33 9',
    })
    const desc = await call(remult, 'post', { __action: 'groupBy' }, {
      groupBy: ['name'],
      orderBy: [
        { operation: 'count', isDescending: true },
        { field: 'email', isDescending: true },
      ],
    })
    const asc = await call(remult, 'post', { __action: 'groupBy' }, {
      groupBy: ['name'],
      orderBy: [{ operation: 'count', isDescending: false }],
    })
    expect(desc.data.map((row: { name: string; $count: number }) => [row.name, row.$count])).toEqual([
      ['Ann', 2],
      ['Bob', 1],
    ])
    expect(asc.data.map((row: { name: string }) => row.name)).toEqual(['Bob', 'Ann'])
  })

  it('groupBy on a role-gated field', async () => {
    const anon = await call(
      await setup(),
      'post',
      { __action: 'groupBy' },
      { groupBy: ['phone'] },
    )
    const missing = await call(
      await setup(),
      'post',
      { __action: 'groupBy' },
      { groupBy: ['noSuch'] },
    )
    expect(anon).toEqual(missing)
    expect(
      (
        await call(
          await setup(['admin']),
          'post',
          { __action: 'groupBy' },
          { groupBy: ['phone'] },
        )
      ).data,
    ).toEqual([
      { phone: '+33 1', $count: 1 },
      { phone: '+44 2', $count: 1 },
    ])
  })

  it('deleteMany', async () => {
    const remult = await setup()
    const hidden = await call(
      remult,
      'post',
      { __action: 'deleteMany' },
      { where: { 'email.startsWith': 'bob@' } },
    )
    const missing = await call(
      await setup(),
      'post',
      { __action: 'deleteMany' },
      { where: { 'noSuch.startsWith': 'bob@' } },
    )
    expect(hidden.status).toBe('error')
    expect(hidden.status).toBe(missing.status)
    expect(await remult.repo(Person).count()).toBe(2)
  })
})
