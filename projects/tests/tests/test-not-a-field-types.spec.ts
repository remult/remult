import { describe, it, expect, expectTypeOf, beforeEach } from 'vitest'
import {
  Entity,
  Fields,
  InMemoryDataProvider,
  Remult,
  type MembersOnly,
  type NotAField,
} from '../../core'

class Money implements NotAField {
  declare readonly isNotAField: true
  constructor(
    readonly cents: number,
    readonly currency: string,
  ) {}
}

@Entity('orders')
class Order {
  @Fields.integer()
  id = 0
  @Fields.integer()
  priceCents = 0
  @Fields.string()
  priceCurrency = 'USD'
  get price() {
    return new Money(this.priceCents, this.priceCurrency)
  }
  set price(value: Money) {
    this.priceCents = value.cents
    this.priceCurrency = value.currency
  }
  get discount(): Money | null {
    return null
  }
}

describe('NotAField types', () => {
  let remult: Remult
  beforeEach(() => {
    remult = new Remult(new InMemoryDataProvider())
  })

  it('leaves NotAField properties out of the members', () => {
    expectTypeOf<keyof MembersOnly<Order>>().toEqualTypeOf<
      'id' | 'priceCents' | 'priceCurrency'
    >()
  })

  it('rejects NotAField properties where fields are expected', async () => {
    const repo = remult.repo(Order)
    const price = new Money(100, 'USD')
    await expect(
      // @ts-expect-error not a field
      repo.find({ where: { price } }),
    ).rejects.toThrow('Field price not found')
    // @ts-expect-error not a field
    await repo.find({ orderBy: { price: 'asc' } })
    // @ts-expect-error not a field
    await repo.insert({ price })
    // @ts-expect-error not a field
    await repo.update(0, { discount: null })
    await expect(
      // @ts-expect-error not a field
      repo.groupBy({ group: ['price'] }),
    ).rejects.toThrow('key "price" not found')
    // @ts-expect-error not a field
    repo.fields.price
  })

  it('keeps the property on the entity', async () => {
    const order = remult.repo(Order).create({ id: 1 })
    order.price = new Money(250, 'EUR')
    const saved = await remult.repo(Order).save(order)
    expect(saved.price).toEqual(new Money(250, 'EUR'))
    expect(await remult.repo(Order).count({ priceCents: { $gte: 100 } })).toBe(
      1,
    )
  })
})
