import { describe, expect, it } from 'vitest'
import type { TableInfo } from '../core/god.svelte.js'
import { field } from '../query/fixtures.js'
import {
  edgesFor,
  layered,
  layoutEntities,
  NODE_WIDTH,
  orthoPath,
  routePoints,
} from './layout.js'

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
    apiPrefilter: false,
    permissions: { insert: true, update: true, delete: true },
    repo: undefined as never,
    ...p,
  }
}

const toOne = (key: string, entityKey: string) =>
  field({
    key,
    relationToOne: {
      entityKey,
      fields: { id: `${key}Id` },
      compoundIdField: undefined,
      idField: 'id',
      captionField: 'name',
      allowNull: false,
    },
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
  table('a', {
    fields: [field({ key: 'id' }), toOne('b', 'b'), toOne('e', 'e')],
  }),
  table('d'),
  table('b', {
    fields: [field({ key: 'id' }), toOne('c', 'c')],
    relations: [toMany('as', 'a')],
  }),
  table('c'),
  table('e', { hidden: true }),
]

const pos = (r: ReturnType<typeof layoutEntities>) =>
  Object.fromEntries(r.nodes.map((n) => [n.id, n.position]))

describe('layoutEntities', () => {
  it('only visible entities become nodes, and edges only join visible ones', () => {
    const r = layoutEntities(tables, 'grid-bfs', {})
    expect(r.nodes.map((n) => n.id)).toEqual(['a', 'd', 'b', 'c'])
    expect(r.nodes.every((n) => n.type === 'entity')).toBe(true)
    expect(r.edges.map((e) => [e.source, e.target, e.id])).toEqual([
      ['a', 'b', 'a.b'],
      ['b', 'c', 'b.c'],
    ])
  })

  it('a saved position wins', () => {
    const r = layoutEntities(tables, 'grid-dfs', { b: { x: 1000, y: 40 } })
    expect(pos(r).b).toEqual({ x: 1000, y: 40 })
  })

  it('unsaved entities get the same positions each time, per layout', () => {
    for (const algo of ['grid-bfs', 'grid-dfs', 'line'] as const) {
      expect(pos(layoutEntities(tables, algo, {}))).toEqual(
        pos(layoutEntities(tables, algo, {})),
      )
    }
    // line: related ones first, then the next group, all on one row
    const line = pos(layoutEntities(tables, 'line', {}))
    expect([
      line.a.x < line.b.x,
      line.b.x < line.c.x,
      line.c.x < line.d.x,
    ]).toEqual([true, true, true])
    expect(new Set(Object.values(line).map((p) => p.y))).toEqual(new Set([0]))
    // grid: 4 visible -> 3 columns, shortest column takes the next one
    const grid = pos(layoutEntities(tables, 'grid-bfs', {}))
    expect(new Set(Object.values(grid).map((p) => p.x)).size).toBe(3)
    expect(grid.a).toEqual({ x: 0, y: 0 })
  })

  it('bfs and dfs order related entities differently', () => {
    // a -> b, a -> c, b -> d: bfs a b c d, dfs a b d c
    const t = [
      table('a', {
        fields: [field({ key: 'id' }), toOne('b', 'b'), toOne('c', 'c')],
      }),
      table('b', { fields: [field({ key: 'id' }), toOne('d', 'd')] }),
      table('c'),
      table('d'),
    ]
    const x = (algo: 'grid-bfs' | 'grid-dfs') => {
      const p = pos(layoutEntities(t, algo, {}))
      return Object.keys(p).sort(
        (k1, k2) => p[k1].x - p[k2].x || p[k1].y - p[k2].y,
      )
    }
    expect(x('grid-bfs')).toEqual(['a', 'b', 'c', 'd'])
    expect(x('grid-dfs')).toEqual(['a', 'b', 'd', 'c'])
  })

  it('two relations to the same entity place it once', () => {
    // a -> b twice, a -> c, d: b must not take two grid slots
    const twice = [
      table('a', {
        fields: [
          field({ key: 'id' }),
          toOne('b1', 'b'),
          toOne('b2', 'b'),
          toOne('c', 'c'),
        ],
      }),
      table('b'),
      table('c'),
      table('d'),
    ]
    const once = [
      table('a', {
        fields: [
          field({ key: 'id' }),
          toOne('b1', 'b'),
          field({ key: 'x' }),
          toOne('c', 'c'),
        ],
      }),
      ...twice.slice(1),
    ]
    for (const algo of ['grid-bfs', 'grid-dfs', 'line'] as const) {
      expect(pos(layoutEntities(twice, algo, {}))).toEqual(
        pos(layoutEntities(once, algo, {})),
      )
    }
  })

  it('edges leave and enter on the sides facing each other', () => {
    const r = layoutEntities(tables, 'line', {
      a: { x: 0, y: 0 },
      b: { x: 500, y: 0 },
      c: { x: 100, y: 300 },
    })
    const e = Object.fromEntries(
      r.edges.map((x) => [x.id, [x.sourceHandle, x.targetHandle]]),
    )
    expect(e['a.b']).toEqual(['b-r', 'in-l'])
    expect(e['b.c']).toEqual(['c-l', 'in-r'])
    // the to-one a.b already draws it
    expect(e['b.as']).toBeUndefined()
  })

  it('a self relation loops on the right, edges follow moved nodes', () => {
    const self = [
      table('t', { fields: [field({ key: 'id' }), toOne('parent', 't')] }),
    ]
    expect(layoutEntities(self, 'grid-bfs', {}).edges[0]).toMatchObject({
      sourceHandle: 'parent-r',
      targetHandle: 'in-r',
    })
    const moved = edgesFor(tables.slice(0, 4), {
      a: { x: 900, y: 0 },
      b: { x: 0, y: 0 },
      c: { x: 0, y: 0 },
      d: { x: 0, y: 0 },
    })
    expect(moved.find((x) => x.id === 'a.b')).toMatchObject({
      sourceHandle: 'b-l',
      targetHandle: 'in-r',
    })
  })
})

describe('layered', () => {
  // c is the root, b points to c, a to b and c (a long link over b's column), x alone
  const graph = [
    table('a', {
      fields: [field({ key: 'id' }), toOne('b', 'b'), toOne('c', 'c')],
    }),
    table('b', { fields: [field({ key: 'id' }), toOne('c', 'c')] }),
    table('c', { relations: [toMany('bs', 'b')] }),
    table('x'),
  ]
  const boxes = (l: ReturnType<typeof layered>) =>
    Object.entries(l.positions).map(([k, p]) => ({ k, ...p, w: NODE_WIDTH }))

  it('puts parents left of their children', () => {
    const { positions: p } = layered(graph)
    expect(p.c.x).toBeLessThan(p.b.x)
    expect(p.b.x).toBeLessThan(p.a.x)
  })

  it('routes a long link through the column it crosses, clear of its nodes', () => {
    const l = layered(graph)
    const { xs = [], ys = [] } = l.routes['a.c']
    const { a, b, c } = l.positions
    // one vertical in each gap, a run across b's column above or below b
    expect(xs).toHaveLength(2)
    expect(xs[0]).toBeGreaterThan(b.x + NODE_WIDTH)
    expect(xs[0]).toBeLessThan(a.x)
    expect(xs[1]).toBeGreaterThan(c.x + NODE_WIDTH)
    expect(xs[1]).toBeLessThan(b.x)
    expect(ys).toHaveLength(1)
    expect(ys[0] > b.y && ys[0] < b.y + 100).toBe(false)
  })

  it('links into the same row share a vertical, others get their own', () => {
    const { routes } = layered(graph)
    // a.c and b.c both end at c's id row, in the gap left of b
    expect(routes['a.c'].xs![1]).toBe(routes['b.c'].xs![0])
    expect(routes['a.b'].xs![0]).not.toBe(routes['a.c'].xs![0])
  })

  it('no two nodes overlap, entities without links go under a column', () => {
    const l = layered(graph)
    const bs = boxes(l)
    for (const a of bs)
      for (const b of bs) {
        if (a.k >= b.k || a.x !== b.x) continue
        expect(Math.abs(a.y - b.y)).toBeGreaterThan(40)
      }
    const col = Object.entries(l.positions).find(
      ([k, p]) => k !== 'x' && p.x === l.positions.x.x,
    )!
    expect(l.positions.x.y).toBeGreaterThan(col[1].y)
  })

  it('orthoPath rounds corners and skips straight runs', () => {
    const pts = routePoints({ x: 0, y: 0 }, { x: 100, y: 40 }, { xs: [50] })
    expect(pts).toEqual([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 40 },
      { x: 100, y: 40 },
    ])
    expect(orthoPath(pts)).toBe(
      'M 0,0 L 42,0 Q 50,0 50,8 L 50,32 Q 50,40 58,40 L 100,40',
    )
    expect(orthoPath(routePoints({ x: 0, y: 5 }, { x: 90, y: 5 }, {}))).toBe(
      'M 0,5 L 90,5',
    )
  })

  it('is deterministic', () => {
    expect(layered(graph)).toEqual(layered(graph))
  })

  it('draws one edge per relationship, the to-one side', () => {
    const r = layoutEntities(graph, 'layered', {})
    expect(r.edges.map((e) => e.id).sort()).toEqual(['a.b', 'a.c', 'b.c'])
    expect(r.edges.find((e) => e.id === 'a.c')?.data?.xs).toHaveLength(2)
  })

  it('a moved node drops the routes of its edges', () => {
    const r = layoutEntities(graph, 'layered', { a: { x: 5000, y: 0 } })
    expect(r.edges.find((e) => e.id === 'a.c')).toMatchObject({
      type: 'smoothstep',
      data: {},
    })
  })
})
