import { describe, expect, it } from 'vitest'
import { Module } from '../../core/server/module.js'
import { modulesFlatAndOrdered } from '../../core/server/module.js'

describe('modules', () => {
  it('a few modules', () => {
    const modules: Module<any>[] = [
      new Module({
        key: 'init',
        modules: [new Module({ key: 'a' }), new Module({ key: 'b' })],
      }),
      new Module({ key: 'main' }),

      new Module({ key: 'main last', priority: 100 }),
      new Module({ key: 'prio', priority: -1000 }),
      new Module({
        key: 'the end',
        modules: [new Module({ key: 'd' }), new Module({ key: 'c' })],
      }),
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
        },
        {
          "controllers": undefined,
          "entities": undefined,
          "initApi": undefined,
          "initRequest": undefined,
          "key": "init",
          "priority": 0,
        },
        {
          "controllers": undefined,
          "entities": undefined,
          "initApi": undefined,
          "initRequest": undefined,
          "key": "init-a",
          "priority": 0,
        },
        {
          "controllers": undefined,
          "entities": undefined,
          "initApi": undefined,
          "initRequest": undefined,
          "key": "init-b",
          "priority": 0,
        },
        {
          "controllers": undefined,
          "entities": undefined,
          "initApi": undefined,
          "initRequest": undefined,
          "key": "main",
          "priority": 0,
        },
        {
          "controllers": undefined,
          "entities": undefined,
          "initApi": undefined,
          "initRequest": undefined,
          "key": "the end",
          "priority": 0,
        },
        {
          "controllers": undefined,
          "entities": undefined,
          "initApi": undefined,
          "initRequest": undefined,
          "key": "the end-d",
          "priority": 0,
        },
        {
          "controllers": undefined,
          "entities": undefined,
          "initApi": undefined,
          "initRequest": undefined,
          "key": "the end-c",
          "priority": 0,
        },
        {
          "controllers": undefined,
          "entities": undefined,
          "initApi": undefined,
          "initRequest": undefined,
          "key": "main last",
          "priority": 100,
        },
      ]
    `)
  })

  it('empty list', () => {
    const res = modulesFlatAndOrdered([])
    expect(res).toMatchInlineSnapshot(`[]`)
  })
})
