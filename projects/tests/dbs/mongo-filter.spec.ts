import { describe, expect, it } from 'vitest'
import { Entity, Fields, Remult, describeClass } from '../../core'
import { MongoDataProvider } from '../../core/remult-mongo'

const operators = [
  ['$contains', '', ''],
  ['$notContains', '', ''],
  ['$startsWith', '^', ''],
  ['$endsWith', '', '$'],
] as const

type Operator = (typeof operators)[number][0]

async function filterToRaw(operator: Operator, value: string) {
  class Item {
    id = ''
    title = ''
  }
  describeClass(Item, Entity('items'), {
    id: Fields.id(),
    title: Fields.string({ dbName: 'stored_title' }),
  })
  return MongoDataProvider.filterToRaw(new Remult().repo(Item), {
    title: { [operator]: value },
  })
}

describe.each(operators)('Mongo %s string filters', (operator, start, end) => {
  it.each([
    ['a.b', 'a\\.b'],
    ['[', '\\['],
    ['a+b', 'a\\+b'],
    ['a\\b', 'a\\\\b'],
    ['.*+?^${}()|[]\\', '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\'],
    ['OrDiNaRy', 'OrDiNaRy'],
  ])('treats %s as a literal substring', async (value, escaped) => {
    const regex = { $regex: start + escaped + end, $options: 'i' }
    expect(await filterToRaw(operator, value)).toEqual({
      $and: [
        {
          stored_title: operator === '$notContains' ? { $not: regex } : regex,
        },
      ],
    })
  })

  it('preserves case-insensitive matching and operator boundaries', async () => {
    const raw = await filterToRaw(operator, 'a.b')
    if (!raw.$and) throw new Error('Expected a Mongo string filter')
    const filter = raw.$and[0].stored_title
    const expression = operator === '$notContains' ? filter.$not : filter
    const regex = new RegExp(expression.$regex, expression.$options)
    const values = ['A.B', 'xA.B', 'A.By', 'xA.By', 'aXb']
    const expected = {
      $contains: ['A.B', 'xA.B', 'A.By', 'xA.By'],
      $notContains: ['aXb'],
      $startsWith: ['A.B', 'A.By'],
      $endsWith: ['A.B', 'xA.B'],
    }
    expect(
      values.filter((value) =>
        operator === '$notContains' ? !regex.test(value) : regex.test(value),
      ),
    ).toEqual(expected[operator])
  })
})
