import { describe, expect, it } from 'vitest'
import type { TableInfo } from '../core/god.svelte.js'
import { field } from '../query/fixtures.js'
import { edgesFor, layoutEntities } from './layout.js'

function table(key: string, p: Partial<TableInfo> = {}): TableInfo {
  return {
    superKey: key,
    key,
    caption: key,
    fields: [field({ key: 'id' })],
    ids: { id: true },
    relations: [],
    hidden: false,
    editMode: 'inline',
    editModeLocked: false,
    permissions: { insert: true, update: true, delete: true },
    repo: undefined as never,
    ...p,
  }
}

const toOne = (key: string, entityKey: string) =>
  field({
    key,
    relationToOne: { entityKey, fields: { id: `${key}Id` }, compoundIdField: undefined, idField: 'id', captionField: 'name', allowNull: false },
  })

const toMany = (key: string, entityKey: string) => ({
  key,
  caption: key,
  entityKey,
  fields: { [`${key}Id`]: 'id' },
  compoundIdField: undefined,
})

// a -> b -> c, d alone, e hidden (a points to it too)
const tables = [
  table('a', { fields: [field({ key: 'id' }), toOne('b', 'b'), toOne('e', 'e')] }),
  table('d'),
  table('b', { fields: [field({ key: 'id' }), toOne('c', 'c')], relations: [toMany('as', 'a')] }),
  table('c'),
  table('e', { hidden: true }),
]

const pos = (r: ReturnType<typeof layoutEntities>) => Object.fromEntries(r.nodes.map((n) => [n.id, n.position]))

describe('layoutEntities', () => {
  it('only visible entities become nodes, and edges only join visible ones', () => {
    const r = layoutEntities(tables, 'grid-bfs', {})
    expect(r.nodes.map((n) => n.id)).toEqual(['a', 'd', 'b', 'c'])
    expect(r.nodes.every((n) => n.type === 'entity')).toBe(true)
    expect(r.edges.map((e) => [e.source, e.target, e.id])).toEqual([
      ['a', 'b', 'a.b'],
      ['b', 'c', 'b.c'],
      ['b', 'a', 'b.as'],
    ])
  })

  it('a saved position wins', () => {
    const r = layoutEntities(tables, 'grid-dfs', { b: { x: 1000, y: 40 } })
    expect(pos(r).b).toEqual({ x: 1000, y: 40 })
  })

  it('unsaved entities get the same positions each time, per layout', () => {
    for (const algo of ['grid-bfs', 'grid-dfs', 'line'] as const) {
      expect(pos(layoutEntities(tables, algo, {}))).toEqual(pos(layoutEntities(tables, algo, {})))
    }
    // line: related ones first, then the next group, all on one row
    const line = pos(layoutEntities(tables, 'line', {}))
    expect([line.a.x < line.b.x, line.b.x < line.c.x, line.c.x < line.d.x]).toEqual([true, true, true])
    expect(new Set(Object.values(line).map((p) => p.y))).toEqual(new Set([0]))
    // grid: 4 visible -> 3 columns, shortest column takes the next one
    const grid = pos(layoutEntities(tables, 'grid-bfs', {}))
    expect(new Set(Object.values(grid).map((p) => p.x)).size).toBe(3)
    expect(grid.a).toEqual({ x: 0, y: 0 })
  })

  it('bfs and dfs order related entities differently', () => {
    // a -> b, a -> c, b -> d: bfs a b c d, dfs a b d c
    const t = [
      table('a', { fields: [field({ key: 'id' }), toOne('b', 'b'), toOne('c', 'c')] }),
      table('b', { fields: [field({ key: 'id' }), toOne('d', 'd')] }),
      table('c'),
      table('d'),
    ]
    const x = (algo: 'grid-bfs' | 'grid-dfs') => {
      const p = pos(layoutEntities(t, algo, {}))
      return Object.keys(p).sort((k1, k2) => p[k1].x - p[k2].x || p[k1].y - p[k2].y)
    }
    expect(x('grid-bfs')).toEqual(['a', 'b', 'c', 'd'])
    expect(x('grid-dfs')).toEqual(['a', 'b', 'd', 'c'])
  })

  it('edges leave and enter on the sides facing each other', () => {
    const r = layoutEntities(tables, 'line', { a: { x: 0, y: 0 }, b: { x: 500, y: 0 }, c: { x: 100, y: 300 } })
    const e = Object.fromEntries(r.edges.map((x) => [x.id, [x.sourceHandle, x.targetHandle]]))
    expect(e['a.b']).toEqual(['b-r', 'in-l'])
    expect(e['b.c']).toEqual(['c-l', 'in-r'])
    expect(e['b.as']).toEqual(['as-l', 'in-r'])
  })

  it('a self relation loops on the right, edges follow moved nodes', () => {
    const self = [table('t', { fields: [field({ key: 'id' }), toOne('parent', 't')] })]
    expect(layoutEntities(self, 'grid-bfs', {}).edges[0]).toMatchObject({ sourceHandle: 'parent-r', targetHandle: 'in-r' })
    const moved = edgesFor(tables.slice(0, 4), { a: { x: 900, y: 0 }, b: { x: 0, y: 0 }, c: { x: 0, y: 0 }, d: { x: 0, y: 0 } })
    expect(moved.find((x) => x.id === 'a.b')).toMatchObject({ sourceHandle: 'b-l', targetHandle: 'in-r' })
  })
})
