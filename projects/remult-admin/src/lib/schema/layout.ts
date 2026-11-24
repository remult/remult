import type { Edge, MarkerType, Node } from '@xyflow/svelte'
import type { TableInfo } from '../core/god.svelte.js'

export type DiagramLayout = 'layered' | 'grid-bfs' | 'grid-dfs' | 'line'
export type XY = { x: number; y: number }
// plain data: xyflow structured-clones it to warn about deep state, a repo would not clone
export type EntityNodeData = {
  superKey: string
  color: string
  compact: boolean
}
export type EntityNode = Node<EntityNodeData, 'entity'>
/** Points an edge passes through, from its source to its target. */
export type RoutedEdgeData = { via?: XY[] }

/** Px, fixed so side picking and the grid never need measured sizes. */
export const NODE_WIDTH = 248
const HEADER_H = 38
const ROW_H = 26
const COLUMN_GAP = 96
const ROW_GAP = 56
// layered: room between columns for the edges to curve
const LAYER_GAP = 168
const NODE_GAP = 36
// a long edge crossing a column reserves this much height there
const LANE_H = 10
const LANE_GAP = 14
const SWEEPS = 16

/** Field rows a node shows: all of them, or only ids and relations (compact). */
export function shownFields(t: TableInfo, compact: boolean) {
  const fields = compact
    ? t.fields.filter((f) => t.ids[f.key] || f.relationToOne)
    : t.fields
  return { fields, more: t.fields.length - fields.length }
}

function nodeHeight(t: TableInfo, compact = false) {
  const { fields, more } = shownFields(t, compact)
  return (
    HEADER_H + (fields.length + t.relations.length + (more ? 1 : 0)) * ROW_H + 8
  )
}

/** Y of a field or relation row's handle, from the node top. */
function rowY(t: TableInfo, row: string, compact: boolean) {
  const { fields } = shownFields(t, compact)
  let i = fields.findIndex((f) => f.key === row)
  if (i < 0) {
    const r = t.relations.findIndex((x) => x.key === row)
    i = r < 0 ? 0 : fields.length + r
  }
  return HEADER_H + 4 + i * ROW_H + ROW_H / 2
}
const headY = HEADER_H / 2

/** Entity keys this table points to, to-one first, in field order. */
function neighbours(t: TableInfo) {
  return [
    ...t.fields.flatMap((f) =>
      f.relationToOne ? [f.relationToOne.entityKey] : [],
    ),
    ...t.relations.map((r) => r.entityKey),
  ]
}

// entity key -> its first table: relations name keys, nodes are per superKey
function indexByKey(tables: TableInfo[]) {
  const byKey = new Map<string, TableInfo>()
  for (const t of tables) if (!byKey.has(t.key)) byKey.set(t.key, t)
  return byKey
}

/** One drawn line: a to-one field, or a to-many relation nobody points back with a to-one. */
type Link = {
  id: string
  source: string
  target: string
  row: string
  kind: 'one' | 'many'
  /** The many side and the one side, by superKey. */
  child: string
  parent: string
}

function links(tables: TableInfo[]): Link[] {
  const byKey = indexByKey(tables)
  const out: Link[] = []
  const pairs = new Set<string>()
  for (const t of tables)
    for (const f of t.fields) {
      const p = f.relationToOne && byKey.get(f.relationToOne.entityKey)
      if (!p) continue
      pairs.add(`${t.superKey}|${p.superKey}`)
      out.push({
        id: `${t.superKey}.${f.key}`,
        source: t.superKey,
        target: p.superKey,
        row: f.key,
        kind: 'one',
        child: t.superKey,
        parent: p.superKey,
      })
    }
  for (const t of tables)
    for (const r of t.relations) {
      const c = byKey.get(r.entityKey)
      // the to-one on the other side already draws this relationship
      if (!c || pairs.has(`${c.superKey}|${t.superKey}`)) continue
      out.push({
        id: `${t.superKey}.${r.key}`,
        source: t.superKey,
        target: c.superKey,
        row: r.key,
        kind: 'many',
        child: c.superKey,
        parent: t.superKey,
      })
    }
  return out
}

/** Related entities end up next to each other: each group is a connected component in bfs or dfs order. */
function ordered(tables: TableInfo[], algo: DiagramLayout) {
  const byKey = indexByKey(tables)
  const seen = new Set<string>()
  const out: TableInfo[] = []
  // may repeat an entity (two relations to it): callers check `seen` per step
  const next = (t: TableInfo) =>
    neighbours(t).flatMap((k) => byKey.get(k) ?? [])
  const dfs = (t: TableInfo) => {
    seen.add(t.superKey)
    out.push(t)
    for (const n of next(t)) if (!seen.has(n.superKey)) dfs(n)
  }
  const bfs = (start: TableInfo) => {
    const queue = [start]
    seen.add(start.superKey)
    while (queue.length) {
      const t = queue.shift()!
      out.push(t)
      for (const n of next(t)) {
        if (seen.has(n.superKey)) continue
        seen.add(n.superKey)
        queue.push(n)
      }
    }
  }
  for (const t of tables) {
    if (seen.has(t.superKey)) continue
    if (algo === 'grid-bfs') bfs(t)
    else dfs(t)
  }
  return out
}

function place(
  tables: TableInfo[],
  algo: DiagramLayout,
  saved: Record<string, XY>,
) {
  const positions: Record<string, XY> = {}
  const columns = Array<number>(
    Math.max(1, Math.ceil(Math.sqrt(tables.length * 2))),
  ).fill(0)
  let index = 0
  for (const t of ordered(tables, algo)) {
    const s = saved[t.superKey]
    if (s) {
      positions[t.superKey] = { x: s.x, y: s.y }
      continue
    }
    if (algo === 'line') {
      positions[t.superKey] = { x: index++ * (NODE_WIDTH + COLUMN_GAP), y: 0 }
      continue
    }
    // masonry: the shortest column takes the next entity
    const col = columns.indexOf(Math.min(...columns))
    positions[t.superKey] = {
      x: col * (NODE_WIDTH + COLUMN_GAP),
      y: columns[col],
    }
    columns[col] += nodeHeight(t) + ROW_GAP
  }
  return positions
}

type Item = {
  id: string
  /** Set on a lane: the link it carries across this column. */
  lane?: string
  h: number
  y: number
}

/** Pool adjacent violators: the closest non decreasing sequence to `v`, by least squares. */
function isotonic(v: number[]): number[] {
  const blocks: { sum: number; n: number }[] = []
  for (const x of v) {
    blocks.push({ sum: x, n: 1 })
    while (
      blocks.length > 1 &&
      blocks.at(-2)!.sum / blocks.at(-2)!.n >
        blocks.at(-1)!.sum / blocks.at(-1)!.n
    ) {
      const b = blocks.pop()!
      blocks.at(-1)!.sum += b.sum
      blocks.at(-1)!.n += b.n
    }
  }
  return blocks.flatMap((b) => Array<number>(b.n).fill(b.sum / b.n))
}

const gapBetween = (a: Item, b: Item) =>
  a.lane || b.lane ? LANE_GAP : NODE_GAP

/** Tops as close to `want` as the order and the gaps allow. */
function settle(layer: Item[], want: number[]) {
  const offsets: number[] = []
  let o = 0
  layer.forEach((it, i) => {
    offsets.push(o)
    o += it.h + (i + 1 < layer.length ? gapBetween(it, layer[i + 1]) : 0)
  })
  const z = isotonic(want.map((w, i) => w - offsets[i]))
  layer.forEach((it, i) => (it.y = z[i] + offsets[i]))
}

/** Crossings between two adjacent columns, for links given as [upper index, lower index]. */
function crossings(pairs: [number, number][]) {
  let n = 0
  for (let i = 0; i < pairs.length; i++)
    for (let j = i + 1; j < pairs.length; j++) {
      const [a, b] = pairs[i]
      const [c, d] = pairs[j]
      if ((a - c) * (b - d) < 0) n++
    }
  return n
}

/**
 * Layered (Sugiyama) layout: parents left, children right, long links on reserved lanes.
 * Returns top-left positions and, per link id, the points its edge passes through.
 */
export function layered(tables: TableInfo[], compact = true) {
  const all = links(tables)
  const bySk = new Map(tables.map((t) => [t.superKey, t]))
  const ranked = all.filter((l) => l.child !== l.parent)
  const connected = new Set(ranked.flatMap((l) => [l.child, l.parent]))
  const nodes = ordered(tables, 'grid-dfs')
    .map((t) => t.superKey)
    .filter((k) => connected.has(k))
  const order = new Map(nodes.map((k, i) => [k, i]))

  // child -> parent edges, cycles broken where a dfs meets its own path
  const parents = new Map<string, Set<string>>(nodes.map((k) => [k, new Set()]))
  const children = new Map<string, Set<string>>(
    nodes.map((k) => [k, new Set()]),
  )
  const state = new Map<string, 1 | 2>()
  const out = new Map<string, string[]>(nodes.map((k) => [k, []]))
  for (const l of ranked) out.get(l.child)!.push(l.parent)
  const visit = (k: string) => {
    state.set(k, 1)
    for (const p of out.get(k)!) {
      if (state.get(p) === 1) continue
      parents.get(k)!.add(p)
      children.get(p)!.add(k)
      if (!state.has(p)) visit(p)
    }
    state.set(k, 2)
  }
  for (const k of nodes) if (!state.has(k)) visit(k)

  // longest path from the roots, then each node slides to where its links are shortest
  const rank = new Map<string, number>()
  const rankOf = (k: string): number => {
    if (rank.has(k)) return rank.get(k)!
    rank.set(k, 0)
    const r = Math.max(-1, ...[...parents.get(k)!].map(rankOf)) + 1
    rank.set(k, r)
    return r
  }
  for (const k of nodes) rankOf(k)
  for (let pass = 0; pass < 4; pass++)
    for (const k of [...nodes].sort((a, b) => rank.get(b)! - rank.get(a)!)) {
      const ps = [...parents.get(k)!].map((p) => rank.get(p)!)
      const cs = [...children.get(k)!].map((c) => rank.get(c)!)
      const lo = ps.length ? Math.max(...ps) + 1 : -Infinity
      const hi = cs.length ? Math.min(...cs) - 1 : Infinity
      if (cs.length > ps.length && hi !== Infinity) rank.set(k, hi)
      else if (ps.length > cs.length && lo !== -Infinity) rank.set(k, lo)
    }
  const min = Math.min(0, ...rank.values())
  for (const [k, r] of rank) rank.set(k, r - min)

  // columns, with a lane item for each column a long link crosses
  const depth = Math.max(0, ...rank.values()) + 1
  const layers: Item[][] = Array.from({ length: depth }, () => [])
  const itemOf = new Map<string, Item>()
  for (const k of nodes) {
    const it: Item = { id: k, h: nodeHeight(bySk.get(k)!, compact), y: 0 }
    itemOf.set(k, it)
    layers[rank.get(k)!].push(it)
  }
  // neighbours of each item in the column on its left and on its right
  const left = new Map<Item, Item[]>()
  const right = new Map<Item, Item[]>()
  const join = (a: Item, b: Item) => {
    // a sits one column left of b
    right.set(a, [...(right.get(a) ?? []), b])
    left.set(b, [...(left.get(b) ?? []), a])
  }
  const lanes = new Map<string, Item[]>()
  for (const l of ranked) {
    const rp = rank.get(l.parent)!
    const rc = rank.get(l.child)!
    const [lo, hi] = rp <= rc ? [l.parent, l.child] : [l.child, l.parent]
    const from = Math.min(rp, rc)
    const to = Math.max(rp, rc)
    if (from === to) continue
    let prev = itemOf.get(lo)!
    const chain: Item[] = []
    for (let r = from + 1; r < to; r++) {
      const lane: Item = { id: `${l.id}@${r}`, lane: l.id, h: LANE_H, y: 0 }
      layers[r].push(lane)
      chain.push(lane)
      join(prev, lane)
      prev = lane
    }
    join(prev, itemOf.get(hi)!)
    if (chain.length) lanes.set(l.id, chain)
  }

  // crossing reduction: barycenter sweeps, keeping the best order seen
  const indexIn = () => {
    const m = new Map<Item, number>()
    for (const layer of layers) layer.forEach((it, i) => m.set(it, i))
    return m
  }
  const score = () => {
    const idx = indexIn()
    let n = 0
    for (let r = 0; r + 1 < layers.length; r++)
      n += crossings(
        layers[r].flatMap((a) =>
          (right.get(a) ?? []).map(
            (b) => [idx.get(a)!, idx.get(b)!] as [number, number],
          ),
        ),
      )
    return n
  }
  // a stable start: dfs order, lanes after their source
  for (const layer of layers)
    layer.sort((a, b) => {
      const ka = a.lane ? (left.get(a)?.[0]?.id ?? '') : a.id
      const kb = b.lane ? (left.get(b)?.[0]?.id ?? '') : b.id
      return (order.get(ka) ?? 0) - (order.get(kb) ?? 0)
    })
  let best = layers.map((l) => [...l])
  let bestScore = score()
  for (let s = 0; s < SWEEPS && bestScore > 0; s++) {
    const down = s % 2 === 0
    const rs = [...layers.keys()]
    if (!down) rs.reverse()
    for (const r of rs.slice(1)) {
      const idx = indexIn()
      const ref = down ? left : right
      const bary = new Map<Item, number>()
      layers[r].forEach((it, i) => {
        const ns = ref.get(it) ?? []
        bary.set(
          it,
          ns.length
            ? ns.reduce((sum, n) => sum + idx.get(n)!, 0) / ns.length
            : i,
        )
      })
      layers[r].sort((a, b) => bary.get(a)! - bary.get(b)!)
    }
    const sc = score()
    if (sc < bestScore) {
      bestScore = sc
      best = layers.map((l) => [...l])
    }
  }
  best.forEach((l, r) => (layers[r] = l))

  // y: each item pulled toward where its links attach on its neighbours, in order, without overlap
  const linkOfLane = new Map<Item, Link>()
  for (const l of ranked)
    for (const lane of lanes.get(l.id) ?? []) linkOfLane.set(lane, l)
  // where a link attaches on an item, from its top
  const port = (it: Item, other: Item) => {
    if (it.lane) return it.h / 2
    const t = bySk.get(it.id)!
    const l =
      linkOfLane.get(other) ??
      ranked.find(
        (x) =>
          (x.child === it.id && x.parent === other.id) ||
          (x.parent === it.id && x.child === other.id),
      )
    if (!l) return it.h / 2
    return l.source === it.id ? rowY(t, l.row, compact) : headY
  }
  for (const layer of layers) {
    let y = 0
    layer.forEach((it, i) => {
      it.y = y
      y += it.h + (i + 1 < layer.length ? gapBetween(it, layer[i + 1]) : 0)
    })
    for (const it of layer) it.y -= y / 2
  }
  for (let s = 0; s < 24; s++) {
    const down = s % 2 === 0
    const rs = [...layers.keys()]
    if (!down) rs.reverse()
    for (const r of rs) {
      const layer = layers[r]
      const want = layer.map((it) => {
        const ns = [...(left.get(it) ?? []), ...(right.get(it) ?? [])]
        if (!ns.length) return it.y
        return (
          ns.reduce((sum, n) => sum + n.y + port(n, it) - port(it, n), 0) /
          ns.length
        )
      })
      settle(layer, want)
    }
  }

  const positions: Record<string, XY> = {}
  const colX = (r: number) => r * (NODE_WIDTH + LAYER_GAP)
  for (const [r, layer] of layers.entries())
    for (const it of layer)
      if (!it.lane) positions[it.id] = { x: colX(r), y: it.y }
  const routes: Record<string, XY[]> = {}
  for (const l of ranked) {
    const chain = lanes.get(l.id)
    if (!chain) continue
    const pts = chain.flatMap((lane) => {
      const r = layers.findIndex((layer) => layer.includes(lane))
      const y = lane.y + lane.h / 2
      return [
        { x: colX(r), y },
        { x: colX(r) + NODE_WIDTH, y },
      ]
    })
    // lanes run left to right: flip when the edge is drawn right to left
    const sourceLeft = rank.get(l.source)! < rank.get(l.target)!
    routes[l.id] = sourceLeft ? pts : pts.reverse()
  }

  // entities without links fill the shortest columns, so the diagram stays compact
  const top = Math.min(0, ...Object.values(positions).map((p) => p.y))
  const bottoms = layers.map((layer) =>
    Math.max(
      top - NODE_GAP,
      ...layer.filter((it) => !it.lane).map((it) => it.y + it.h),
    ),
  )
  if (!bottoms.length) bottoms.push(top - NODE_GAP)
  for (const t of ordered(tables, 'grid-dfs'))
    if (!connected.has(t.superKey)) {
      const r = bottoms.indexOf(Math.min(...bottoms))
      positions[t.superKey] = { x: colX(r), y: bottoms[r] + NODE_GAP }
      bottoms[r] += NODE_GAP + nodeHeight(t, compact)
    }
  // origin at the top left
  for (const p of Object.values(positions)) p.y = Math.round(p.y - top)
  for (const pts of Object.values(routes))
    for (const p of pts) p.y = Math.round(p.y - top)
  return { positions, routes, crossings: bestScore }
}

/** Sides facing each other; a self relation loops on the right. */
function sides(from: XY, to: XY, self: boolean) {
  if (self) return { out: 'r', in: 'r' }
  return from.x <= to.x ? { out: 'r', in: 'l' } : { out: 'l', in: 'r' }
}

/**
 * Edges between the given entities, from the relation row to the target's header, sides from `positions` (by superKey).
 * `routes` (from `layered`) are kept only for edges whose two ends sit where the layout put them.
 */
export function edgesFor(
  tables: TableInfo[],
  positions: Record<string, XY>,
  routed?: { routes: Record<string, XY[]>; at: Record<string, XY> },
): Edge<RoutedEdgeData>[] {
  const same = (k: string) =>
    !!routed &&
    positions[k]?.x === routed.at[k]?.x &&
    positions[k]?.y === routed.at[k]?.y
  return links(tables).flatMap((l) => {
    const from = positions[l.source]
    const to = positions[l.target]
    if (!from || !to) return []
    const s = sides(from, to, l.source === l.target)
    const via =
      routed && same(l.source) && same(l.target)
        ? routed.routes[l.id]
        : undefined
    return [
      {
        id: l.id,
        source: l.source,
        target: l.target,
        sourceHandle: `${l.row}-${s.out}`,
        targetHandle: `in-${s.in}`,
        class: `rel to-${l.kind}`,
        type: routed ? 'routed' : undefined,
        data: via ? { via } : {},
        markerEnd: {
          type: 'arrowclosed' as MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: 'var(--xy-edge-stroke)',
        },
      },
    ]
  })
}

export function layoutEntities(
  tables: TableInfo[],
  algo: DiagramLayout,
  saved: Record<string, XY>,
  compact = algo === 'layered',
): {
  nodes: EntityNode[]
  edges: Edge<RoutedEdgeData>[]
  routed?: { routes: Record<string, XY[]>; at: Record<string, XY> }
} {
  const visible = tables.filter((t) => !t.hidden)
  let positions: Record<string, XY>
  let routed:
    | { routes: Record<string, XY[]>; at: Record<string, XY> }
    | undefined
  if (algo === 'layered') {
    const l = layered(visible, compact)
    routed = { routes: l.routes, at: l.positions }
    positions = { ...l.positions }
    for (const [k, s] of Object.entries(saved))
      if (positions[k]) positions[k] = { x: s.x, y: s.y }
  } else positions = place(visible, algo, saved)
  return {
    nodes: visible.map((table) => ({
      id: table.superKey,
      type: 'entity',
      position: positions[table.superKey],
      data: {
        superKey: table.superKey,
        color: table.color ?? '262',
        compact,
      },
    })),
    edges: edgesFor(visible, positions, routed),
    routed,
  }
}
