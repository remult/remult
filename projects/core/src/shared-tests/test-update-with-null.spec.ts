import { SqlDatabase } from '../data-providers/sql-database'
import { Entity, EntityBase, Field, Fields } from '../remult3'
import { testAll } from './db-tests-setup'
import { deleteAll } from './deleteAll'
import { describe, it, expect } from 'vitest'

@Entity('testNull', { allowApiCrud: true })
class testNull extends EntityBase {
  @Fields.integer()
  id: number = 0

  @Field(undefined, { allowNull: true })
  myCol?: {
    value: string
  }
  @Fields.integer({ allowNull: true })
  numberWithNull: number | null = null
}

testAll(
  'test that update null works',
  async ({ createEntity }) => {
    let r = await createEntity(testNull)
    let i = r.create({ id: 1, myCol: { value: 'abc' } })
    await i.save()
    expect(i.myCol?.value).toBe('abc')
    i.myCol = null
    expect(i.myCol).toBe(null)
    await i.save()
    expect(i.myCol).toBe(null)
  },
  false,
)
testAll(
  'test number with null',
  async ({ createEntity }) => {
    let r = await createEntity(testNull)
    const i = await r.insert({
      id: 1,
      myCol: { value: 'abc' },
      numberWithNull: null,
    })
    expect(i.numberWithNull).toBe(null)
    expect(await r.count({ numberWithNull: null })).toBe(1)
    i.numberWithNull = 0
    await i.save()
    expect(i.numberWithNull).toBe(0)
    expect(await r.count({ numberWithNull: null })).toBe(0)
  },
  false,
)
