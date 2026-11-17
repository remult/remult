import { expect } from 'vitest'
import { Entity, EntityBase, Field, Fields } from '../../../core'
import type { DbTestProps } from './db-tests-props'
import { it } from 'vitest'

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

@Entity('testNullByType', { allowApiCrud: true })
class testNullByType {
  @Fields.integer()
  id = 0
  @Fields.date()
  at: Date | null = null
  @Fields.json()
  data: unknown = null
}

export function testUpdateWithNull({ createEntity }: DbTestProps) {
  it('test that update null works', async () => {
    let r = await createEntity(testNull)
    let i = r.create({ id: 1, myCol: { value: 'abc' } })
    await i.save()
    expect(i.myCol?.value).toBe('abc')
    i.myCol = null!
    expect(i.myCol).toBe(null)
    await i.save()
    expect(i.myCol).toBe(null)
  })
  it('test number with null', async () => {
    let r = await createEntity(testNull)
    const i = await r.insert({
      id: 1,
      myCol: { value: 'abc' },
      numberWithNull: null,
    })
    expect(i.numberWithNull).toBe(null)
    expect(await r.count({ numberWithNull: null! })).toBe(1)
    i.numberWithNull = 0
    await i.save()
    expect(i.numberWithNull).toBe(0)
    expect(await r.count({ numberWithNull: null! })).toBe(0)
  })
  it('a Date or json field allows null, as its column does', async () => {
    const r = await createEntity(testNullByType)
    await r.insert([{ id: 1, at: new Date(), data: { a: 1 } }, { id: 2 }])
    expect(await r.count({ at: null!, data: null! })).toBe(1)
    expect(await r.count({ at: { $ne: null! } })).toBe(1)
  })
}
