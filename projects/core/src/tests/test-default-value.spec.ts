import { Remult } from '../context'

import { InMemoryDataProvider } from '../data-providers/in-memory-database'

import { EntityBase, Entity, Fields } from '../remult3'
import { describe, it, expect } from 'vitest'

describe('test default value', () => {
  it('test basics', async () => {
    let c = new Remult()
    c.dataProvider = new InMemoryDataProvider()
    testDefaultValue.testVal = 1
    let r = c.repo(testDefaultValue).create()
    expect(r.test).toBe(1)
    expect(testDefaultValue.testVal).toBe(2)
  })
  it('test create without querying the value', async () => {
    let c = new Remult()
    c.dataProvider = new InMemoryDataProvider()
    testDefaultValue.testVal = 1
    let r = c.repo(testDefaultValue).create()
    await r._.save()
    let res = await c.repo(testDefaultValue).find({})
    expect(res.length).toBe(1)
    expect(testDefaultValue.testVal).toBe(2)
    expect(res[0].test).toBe(1)
  })
})

@Entity('testDefaultValue')
class testDefaultValue extends EntityBase {
  static testVal = 0
  code: number
  @Fields.integer({
    defaultValue: () => testDefaultValue.testVal++,
  })
  test: number
}
