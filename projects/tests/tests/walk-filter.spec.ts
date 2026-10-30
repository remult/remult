import { describe, expect, it } from 'vitest'
import { omitFilterField, walkFilter } from '../../core/internals'

describe('walkFilter', () => {
  it('enters $and, $or, and $not and leaves operator keys inside a field', () => {
    const seen: string[] = []
    walkFilter(
      {
        $and: [{ name: 'Ann' }],
        $or: [{ city: 'Paris' }, { $not: { age: { $gt: 3 } } }],
        $not: [{ email: { $contains: 'a' } }],
      },
      function (key, value) {
        seen.push(key)
        return value
      },
    )
    expect(seen).toEqual(['name', 'city', 'age', 'email'])
  })

  it('drops a key when the visitor returns omitFilterField', () => {
    expect(
      walkFilter(
        { name: 'Ann', email: 'a@a.com', $or: [{ phone: '1' }, { name: 'Bob' }] },
        function (key, value) {
          if (key === 'email' || key === 'phone') return omitFilterField
          return value
        },
      ),
    ).toEqual({ name: 'Ann', $or: [{}, { name: 'Bob' }] })
  })

  it('replaces a field value', () => {
    expect(
      walkFilter({ name: 'Ann', $not: { age: '3' } }, function (key, value) {
        return key === 'age' ? Number(value) : value
      }),
    ).toEqual({ name: 'Ann', $not: { age: 3 } })
  })
})
