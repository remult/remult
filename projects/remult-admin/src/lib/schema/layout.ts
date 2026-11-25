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
/** An orthogonal route: the x of its vertical in each gap it crosses, the y it runs at through each column between. */
export type RoutedEdgeData = { xs?: number[]; ys?: number[] }

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
// verticals in a gap: this far apart, and this far from the nodes at least
const TRACK_GAP = 14
const TRACK_MARGIN = 40
const CORNER = 8

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

/** The row links arrive at: the first id, else the header. */
export function inRow(t: TableInfo, compact: boolean) {
  return shownFields(t, compact).fields.find((f) => t.ids[f.key])?.key
}
function inY(t: TableInfo, compact: boolean) {
  const row = inRow(t, compact)
  return row ? rowY(t, row, compact) : headY
}

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

/** Links sharing one vertical in a gap; each hop runs in at `yl` from the left column and out at `yr` to the right one. */
type Track = {
  hops: { yl: number; yr: number }[]
  lo: number
  hi: number
  x: number
}

const within = (y: number, t: Track) => y > t.lo + 0.5 && y < t.hi - 0.5
/** Crossings when `a` sits left of `b`: a's right stubs over b's vertical, b's left stubs over a's. */
const trackCost = (a: Track, b: Track) =>
  a.hops.filter((h) => within(h.yr, b)).length +
  b.hops.filter((h) => within(h.yl, a)).length

/** Left to right order with the fewest crossings: exhaustive for a few tracks, greedy beyond. */
function orderTracks(tracks: Track[]): Track[] {
  const start = [...tracks].sort((a, b) => a.lo - b.lo || a.hi - b.hi)
  if (start.length > 7) {
    const out: Track[] = []
    for (const t of start) {
      let at = 0
      let best = Infinity
      for (let i = 0; i <= out.length; i++) {
        const c =
          out.slice(0, i).reduce((s, o) => s + trackCost(o, t), 0) +
          out.slice(i).reduce((s, o) => s + trackCost(t, o), 0)
        if (c < best) [best, at] = [c, i]
      }
      out.splice(at, 0, t)
    }
    return out
  }
  let best = start
  let bestCost = Infinity
  const used = new Set<Track>()
  const path: Track[] = []
  const walk = (cost: number) => {
    if (cost >= bestCost) return
    if (path.length === start.length) {
      bestCost = cost
      best = [...path]
      return
    }
    for (const t of start) {
      if (used.has(t)) continue
      used.add(t)
      path.push(t)
      walk(cost + path.slice(0, -1).reduce((s, o) => s + trackCost(o, t), 0))
      path.pop()
      used.delete(t)
    }
  }
  walk(0)
  return best
}

/** Corner points of a route between two handles. */
export function routePoints(s: XY, t: XY, r: RoutedEdgeData): XY[] {
  const xs = r.xs?.length ? r.xs : [(s.x + t.x) / 2]
  const ys = r.ys ?? []
  const pts = [s]
  let y = s.y
  xs.forEach((x, i) => {
    pts.push({ x, y })
    y = i < ys.length ? ys[i] : t.y
    pts.push({ x, y })
  })
  pts.push(t)
  return pts
}

/** SVG path through axis aligned points, corners rounded. */
export function orthoPath(points: XY[], radius = CORNER) {
  const near = (a: number, b: number) => Math.abs(a - b) < 0.5
  const p: XY[] = []
  for (const q of points) {
    const a = p.at(-1)
    if (a && near(a.x, q.x) && near(a.y, q.y)) continue
    const b = p.at(-2)
    // a point on a straight run is no corner
    if (
      a &&
      b &&
      ((near(b.x, a.x) && near(a.x, q.x)) || (near(b.y, a.y) && near(a.y, q.y)))
    )
      p.pop()
    p.push(q)
  }
  let d = `M ${p[0].x},${p[0].y}`
  for (let i = 1; i + 1 < p.length; i++) {
    const [a, b, c] = [p[i - 1], p[i], p[i + 1]]
    const la = Math.hypot(b.x - a.x, b.y - a.y)
    const lc = Math.hypot(c.x - b.x, c.y - b.y)
    const r = Math.min(radius, la / 2, lc / 2)
    const u = { x: (b.x - a.x) / la, y: (b.y - a.y) / la }
    const v = { x: (c.x - b.x) / lc, y: (c.y - b.y) / lc }
    d += ` L ${b.x - u.x * r},${b.y - u.y * r} Q ${b.x},${b.y} ${b.x + v.x * r},${b.y + v.y * r}`
  }
  const last = p.at(-1)!
  return `${d} L ${last.x},${last.y}`
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
    return l.source === it.id ? rowY(t, l.row, compact) : inY(t, compact)
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
  // orthogonal routes: one vertical per gap, links into the same row share it, the others get their own track
  const portY = (k: string, l: Link) =>
    itemOf.get(k)!.y +
    (k === l.source
      ? rowY(bySk.get(k)!, l.row, compact)
      : inY(bySk.get(k)!, compact))
  const gaps = new Map<number, Map<string, Track>>()
  const hopsOf = new Map<string, { gap: number; key: string }[]>()
  const lanesOf = new Map<string, number[]>()
  for (const l of ranked) {
    const rs = rank.get(l.source)!
    const rt = rank.get(l.target)!
    if (rs === rt) continue
    const step = rs < rt ? 1 : -1
    // lanes are chained from the lower rank up
    const chain = lanes.get(l.id) ?? []
    const ys = (step > 0 ? chain : [...chain].reverse()).map(
      (it) => it.y + it.h / 2,
    )
    const seq = [portY(l.source, l), ...ys, portY(l.target, l)]
    const hops: { gap: number; key: string }[] = []
    for (let i = 0; i + 1 < seq.length; i++) {
      const gap = Math.min(rs + step * i, rs + step * (i + 1))
      const [yl, yr] = step > 0 ? [seq[i], seq[i + 1]] : [seq[i + 1], seq[i]]
      const key =
        i + 2 === seq.length
          ? `${l.target}>${step > 0 ? 'l' : 'r'}`
          : `${l.id}@${i}`
      const g = gaps.get(gap) ?? new Map<string, Track>()
      gaps.set(gap, g)
      const t = g.get(key) ?? { hops: [], lo: Infinity, hi: -Infinity, x: 0 }
      g.set(key, t)
      t.hops.push({ yl, yr })
      t.lo = Math.min(t.lo, yl, yr)
      t.hi = Math.max(t.hi, yl, yr)
      hops.push({ gap, key })
    }
    hopsOf.set(l.id, hops)
    lanesOf.set(l.id, ys)
  }
  for (const [gap, g] of gaps) {
    const mid = colX(gap) + NODE_WIDTH + LAYER_GAP / 2
    const flat = [...g.values()].filter((t) => t.hi - t.lo < 1)
    for (const t of flat) t.x = mid
    const tracks = orderTracks([...g.values()].filter((t) => t.hi - t.lo >= 1))
    const step =
      tracks.length > 1
        ? Math.min(
            TRACK_GAP,
            (LAYER_GAP - 2 * TRACK_MARGIN) / (tracks.length - 1),
          )
        : 0
    tracks.forEach((t, i) => (t.x = mid + (i - (tracks.length - 1) / 2) * step))
  }
  const routes: Record<string, RoutedEdgeData> = {}
  for (const [id, hops] of hopsOf)
    routes[id] = {
      xs: hops.map((h) => Math.round(gaps.get(h.gap)!.get(h.key)!.x)),
      ys: lanesOf.get(id)!,
    }

  // entities without links fill the shortest columns, so the diagram stays compact
  const top = Math.min(0, ...layers.flat().map((it) => it.y))
  const bottoms = layers.map((layer) =>
    Math.max(top - NODE_GAP, ...layer.map((it) => it.y + it.h)),
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
  for (const r of Object.values(routes))
    r.ys = r.ys!.map((y) => Math.round(y - top))
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
  routed?: { routes: Record<string, RoutedEdgeData>; at: Record<string, XY> },
): Edge<RoutedEdgeData>[] {
  const same = (k: string) =>
    !!routed &&
    positions[k]?.x === routed.at[k]?.x &&
    positions[k]?.y === routed.at[k]?.y
  return links(tables).flatMap((l) => {
    const from = positions[l.source]
    const to = positions[l.target]
    if (!from || !to) return []
    const self = l.source === l.target
    const s = sides(from, to, self)
    const route =
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
        // moved nodes lose their route: a plain step edge until the next layout
        type: !routed ? undefined : route || self ? 'routed' : 'smoothstep',
        data: route ?? {},
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
  routed?: { routes: Record<string, RoutedEdgeData>; at: Record<string, XY> }
} {
  const visible = tables.filter((t) => !t.hidden)
  let positions: Record<string, XY>
  let routed:
    | { routes: Record<string, RoutedEdgeData>; at: Record<string, XY> }
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
