import { describe, it, expect, expectTypeOf, beforeEach } from 'vitest'
import {
  Entity,
  Fields,
  InMemoryDataProvider,
  Remult,
  type MembersOnly,
  type NotAField,
} from '../../core'

class Money {
  constructor(
    readonly cents: number,
    readonly currency: string,
  ) {}
  add(other: Money) {
    return new Money(this.cents + other.cents, this.currency)
  }
}

class Address {
  constructor(
    readonly street: string,
    readonly city: string,
  ) {}
}

@Entity('invoices')
class Invoice {
  @Fields.integer()
  id = 0
  @Fields.string()
  firstName = ''
  @Fields.string()
  lastName = ''
  get fullName(): NotAField<string> {
    return `${this.firstName} ${this.lastName}`
  }

  // stored in two columns, exposed through a getter and setter
  @Fields.integer()
  subtotalCents = 0
  @Fields.string()
  subtotalCurrency = 'USD'
  get subtotal(): NotAField<Money> {
    return new Money(this.subtotalCents, this.subtotalCurrency)
  }
  set subtotal(value: Money) {
    this.subtotalCents = value.cents
    this.subtotalCurrency = value.currency
  }

  // a plain property, like one a decorator turns into an accessor
  tax: NotAField<Money> | null = null

  // the same class stored as a real field
  @Fields.json()
  total = new Money(0, 'USD')
  @Fields.json()
  address = new Address('', '')
}

describe('NotAField types', () => {
  let remult: Remult
  beforeEach(() => {
    remult = new Remult(new InMemoryDataProvider())
  })

  it('leaves marked properties out of the members', () => {
    expectTypeOf<keyof MembersOnly<Invoice>>().toEqualTypeOf<
      | 'id'
      | 'firstName'
      | 'lastName'
      | 'subtotalCents'
      | 'subtotalCurrency'
      | 'total'
      | 'address'
    >()
  })

  it('keeps unmarked properties of the same class', async () => {
    const repo = remult.repo(Invoice)
    const saved = await repo.insert({ id: 1, total: new Money(100, 'USD') })
    expect(saved.total.cents).toBe(100)
    expect(repo.fields.total.key).toBe('total')
    // compiles, unlike `where: { subtotal }` below
    await repo.find({ where: { total: new Money(100, 'USD') } })
  })

  it('takes plain JSON for a stored value', async () => {
    const saved = await remult
      .repo(Invoice)
      .insert({ id: 1, address: { street: '1 Main', city: 'Springfield' } })
    expect(saved.address.city).toBe('Springfield')
  })

  it('keeps fields typed any, optional or only null', () => {
    class Mixed {
      anything: any = null
      maybe?: Money
      a: null = null
      b: undefined = undefined
    }
    expectTypeOf<keyof MembersOnly<Mixed>>().toEqualTypeOf<
      'anything' | 'maybe' | 'a' | 'b'
    >()
  })

  it('assigns a plain value without a cast', () => {
    const invoice = remult.repo(Invoice).create()
    invoice.subtotal = invoice.subtotal.add(new Money(250, 'USD'))
    invoice.tax = new Money(20, 'USD')
    const subtotal: Money = invoice.subtotal
    const name: string = invoice.fullName
    expect([subtotal.cents, invoice.tax.cents, name]).toEqual([250, 20, ' '])
  })

  it('rejects marked properties where fields are expected', async () => {
    const repo = remult.repo(Invoice)
    const money = new Money(100, 'USD')
    await expect(
      // @ts-expect-error not a field
      repo.find({ where: { subtotal: money } }),
    ).rejects.toThrow('Field subtotal not found')
    // @ts-expect-error not a field
    await repo.find({ where: { fullName: 'a b' } }).catch(() => {})
    // @ts-expect-error not a field
    await repo.find({ orderBy: { subtotal: 'asc' } })
    // @ts-expect-error not a field
    await repo.insert({ tax: money })
    // @ts-expect-error not a field
    await repo.update(0, { tax: null }).catch(() => {})
    await expect(
      // @ts-expect-error not a field
      repo.groupBy({ group: ['subtotal'] }),
    ).rejects.toThrow('key "subtotal" not found')
    // @ts-expect-error not a field
    repo.fields.subtotal
  })

  it('keeps the getter working on the entity', async () => {
    const invoice = remult.repo(Invoice).create({ id: 1 })
    invoice.subtotal = new Money(250, 'EUR')
    const saved = await remult.repo(Invoice).save(invoice)
    expect(saved.subtotal).toEqual(new Money(250, 'EUR'))
    expect(
      await remult.repo(Invoice).count({ subtotalCents: { $gte: 100 } }),
    ).toBe(1)
  })
})
