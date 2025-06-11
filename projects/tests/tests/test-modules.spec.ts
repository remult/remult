import { describe, expect, it } from 'vitest'
import {
  Module,
  modulesFlatAndOrdered,
} from '../../core/server/remult-api-server'

describe('modules', () => {
  it('a few modules', () => {
    const modules: Module<any>[] = [
      new Module({ key: 'init', modules: [{ key: 'a' }, { key: 'b' }] }),
      new Module({ key: 'main' }),

      new Module({ key: 'main last', priority: 100 }),
      new Module({ key: 'prio', priority: -1000 }),
      new Module({ key: 'the end', modules: [{ key: 'd' }, { key: 'c' }] }),
    ]

    console.time('flatten')
    const res = modulesFlatAndOrdered(modules)
    console.timeEnd('flatten')
    expect(res).toMatchInlineSnapshot(`
      [
        {
          "controllers": undefined,
          "entities": undefined,
          "initApi": undefined,
          "initRequest": undefined,
          "key": "prio",
          "priority": -1000,
          "routes": undefined,
        },
        {
          "controllers": undefined,
          "entities": undefined,
          "initApi": undefined,
          "initRequest": undefined,
          "key": "init",
          "priority": undefined,
          "routes": undefined,
        },
        {
          "key": "init-a",
        },
        {
          "key": "init-b",
        },
        {
          "controllers": undefined,
          "entities": undefined,
          "initApi": undefined,
          "initRequest": undefined,
          "key": "main",
          "priority": undefined,
          "routes": undefined,
        },
        {
          "controllers": undefined,
          "entities": undefined,
          "initApi": undefined,
          "initRequest": undefined,
          "key": "the end",
          "priority": undefined,
          "routes": undefined,
        },
        {
          "key": "the end-d",
        },
        {
          "key": "the end-c",
        },
        {
          "controllers": undefined,
          "entities": undefined,
          "initApi": undefined,
          "initRequest": undefined,
          "key": "main last",
          "priority": 100,
          "routes": undefined,
        },
      ]
    `)
  })

  it('empty list', () => {
    const res = modulesFlatAndOrdered([])
    expect(res).toMatchInlineSnapshot(`[]`)
  })
})
