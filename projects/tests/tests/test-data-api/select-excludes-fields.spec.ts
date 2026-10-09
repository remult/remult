import { describe, expect, it } from 'vitest'
import {
  Entity,
  Fields,
  InMemoryDataProvider,
  ValueConverters,
} from '../../../core'
import { Remult } from '../../../core/src/context'
import { DataApi } from '../../../core/src/data-api'
import { TestDataApiResponse } from '../TestDataApiResponse'

// A converter that maps "no value" to '' - the common shape in real apps
// (phone / email / id wrappers) and the one that made unselected fields leak.
const emptyStringConverter = {
  toJson: (val: string) => (val ? val : ''),
  fromJson: (val: string) => (val ? val : ''),
}

@Entity('tasks', { allowApiCrud: true })
class task {
  @Fields.integer()
  id = 0
  @Fields.string()
  title = ''
  @Fields.string()
  notes = ''
  @Fields.date()
  dueDate: Date | null = null
  @Fields.string({ valueConverter: emptyStringConverter })
  phone = ''
}

async function setup() {
  const remult = new Remult(new InMemoryDataProvider())
  await remult.repo(task).insert([
    {
      id: 1,
      title: 'clean',
      notes: 'the kitchen',
      dueDate: new Date(2024, 0, 15),
      phone: '052-765-3002',
    },
  ])
  return remult
}

function requestWithSelect(select: string) {
  return { get: (key: string) => (key === '_select' ? select : undefined) }
}

describe('_select omits unselected fields', () => {
  it('does not emit fields left out by _select', async () => {
    const remult = await setup()
    const api = new DataApi(remult.repo(task), remult)
    const response = new TestDataApiResponse()
    let data: any
    response.success = (d) => (data = d)

    await api.getArray(response, requestWithSelect('id,title'))

    expect(data).toHaveLength(1)
    expect(data[0]).toEqual({ id: 1, title: 'clean' })
  })

  it('a date field left out by _select is absent, not an empty string', async () => {
    const remult = await setup()
    const api = new DataApi(remult.repo(task), remult)
    const response = new TestDataApiResponse()
    let data: any
    response.success = (d) => (data = d)

    await api.getArray(response, requestWithSelect('id'))

    expect('dueDate' in data[0]).toBe(false)
  })

  it('a custom-converter field left out by _select is absent, not an empty string', async () => {
    const remult = await setup()
    const api = new DataApi(remult.repo(task), remult)
    const response = new TestDataApiResponse()
    let data: any
    response.success = (d) => (data = d)

    await api.getArray(response, requestWithSelect('id'))

    // Regression: this used to be '', indistinguishable from a real empty phone.
    expect('phone' in data[0]).toBe(false)
  })

  it('selected fields keep their converted values', async () => {
    const remult = await setup()
    const api = new DataApi(remult.repo(task), remult)
    const response = new TestDataApiResponse()
    let data: any
    response.success = (d) => (data = d)

    await api.getArray(response, requestWithSelect('id,dueDate,phone'))

    expect(data[0].phone).toBe('052-765-3002')
    expect(data[0].dueDate).toBe(
      ValueConverters.Date.toJson!(new Date(2024, 0, 15)),
    )
    expect('title' in data[0]).toBe(false)
  })

  it('without _select every field is returned', async () => {
    const remult = await setup()
    const api = new DataApi(remult.repo(task), remult)
    const response = new TestDataApiResponse()
    let data: any
    response.success = (d) => (data = d)

    await api.getArray(response, { get: () => undefined })

    expect(Object.keys(data[0]).sort()).toEqual([
      'dueDate',
      'id',
      'notes',
      'phone',
      'title',
    ])
  })

  it('repo.find with select omits unselected fields from toApiJson', async () => {
    const remult = await setup()
    const repo = remult.repo(task)

    const [row] = await repo.find({ select: { id: true, title: true } })

    expect(repo.getEntityRef(row).toApiJson()).toEqual({
      id: 1,
      title: 'clean',
    })
  })
})
