import type { Edge, MarkerType, Node } from '@xyflow/svelte'
import type { TableInfo } from '../core/god.svelte.js'

export type DiagramLayout = 'grid-bfs' | 'grid-dfs' | 'line'
export type XY = { x: number; y: number }
// plain data: xyflow structured-clones it to warn about deep state, a repo would not clone
export type EntityNodeData = { superKey: string; color: string }
export type EntityNode = Node<EntityNodeData, 'entity'>

/** Px, fixed so side picking and the grid never need measured sizes. */
export const NODE_WIDTH = 248
const HEADER_H = 38
const ROW_H = 26
const COLUMN_GAP = 96
const ROW_GAP = 56

const nodeHeight = (t: TableInfo) =>
  HEADER_H + (t.fields.length + t.relations.length) * ROW_H + 8

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
    if (algo === 'grid-dfs') dfs(t)
    else bfs(t)
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

/** Sides facing each other; a self relation loops on the right. */
function sides(from: XY, to: XY, self: boolean) {
  if (self) return { out: 'r', in: 'r' }
  return from.x <= to.x ? { out: 'r', in: 'l' } : { out: 'l', in: 'r' }
}

/** Edges between the given entities, from the relation row to the target's header, sides from `positions` (by superKey). */
export function edgesFor(
  tables: TableInfo[],
  positions: Record<string, XY>,
): Edge[] {
  const byKey = indexByKey(tables)
  const edges: Edge[] = []
  const add = (
    t: TableInfo,
    row: string,
    targetKey: string,
    kind: 'one' | 'many',
  ) => {
    const target = byKey.get(targetKey)?.superKey
    const from = positions[t.superKey]
    const to = target && positions[target]
    if (!target || !from || !to) return
    const s = sides(from, to, t.superKey === target)
    edges.push({
      id: `${t.superKey}.${row}`,
      source: t.superKey,
      target,
      sourceHandle: `${row}-${s.out}`,
      targetHandle: `in-${s.in}`,
      class: `rel to-${kind}`,
      markerEnd: {
        type: 'arrowclosed' as MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: 'var(--xy-edge-stroke)',
      },
    })
  }
  for (const t of tables) {
    for (const f of t.fields)
      if (f.relationToOne) add(t, f.key, f.relationToOne.entityKey, 'one')
    for (const r of t.relations) add(t, r.key, r.entityKey, 'many')
  }
  return edges
}

export function layoutEntities(
  tables: TableInfo[],
  algo: DiagramLayout,
  saved: Record<string, XY>,
): { nodes: EntityNode[]; edges: Edge[] } {
  const visible = tables.filter((t) => !t.hidden)
  const positions = place(visible, algo, saved)
  return {
    nodes: visible.map((table) => ({
      id: table.superKey,
      type: 'entity',
      position: positions[table.superKey],
      data: { superKey: table.superKey, color: table.color ?? '262' },
    })),
    edges: edgesFor(visible, positions),
  }
}
