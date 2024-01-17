import { it, expect } from 'vitest'
import { DbTestProps } from './db-tests-props'
import { createEntity as createEntityClass } from '../../tests/dynamic-classes'
import { Fields } from '../../../core'

export function SqlDbTests({ createEntity, getRemult, getDb }: DbTestProps) {
  it('test dbReadonly ', async () => {
    const e = await createEntity(
      createEntityClass('x', {
        id: Fields.number(),
        a: Fields.number(),
        b: Fields.number({ dbReadOnly: true }),
        c: Fields.number({ sqlExpression: () => 'a+5' }),
      }),
    )
    const result = await e.insert({ id: 1, a: 1, b: 2 })
    expect(result).toMatchInlineSnapshot(`
      x {
        "a": 1,
        "b": 0,
        "c": 6,
        "id": 1,
      }
    `)
  })
}
