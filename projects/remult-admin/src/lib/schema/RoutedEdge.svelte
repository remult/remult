<script lang="ts">
  import { BaseEdge, type EdgeProps } from '@xyflow/svelte'
  import type { Edge } from '@xyflow/svelte'
  import type { RoutedEdgeData, XY } from './layout.js'

  let {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    data,
    markerEnd,
    style,
  }: EdgeProps<Edge<RoutedEdgeData>> = $props()

  // horizontal tangents at every point: lanes stay flat, ends leave their row straight
  function curve(points: XY[]) {
    let d = `M ${points[0].x},${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1]
      const b = points[i]
      if (a.y === b.y) {
        d += ` L ${b.x},${b.y}`
        continue
      }
      const dx = (b.x - a.x) / 2
      d += ` C ${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`
    }
    return d
  }

  // a self relation loops out to the right and back
  const path = $derived.by(() => {
    const s = { x: sourceX, y: sourceY }
    const t = { x: targetX, y: targetY }
    if (Math.abs(s.x - t.x) < 1) {
      const out = s.x + 48
      return `M ${s.x},${s.y} C ${out},${s.y} ${out},${t.y} ${t.x},${t.y}`
    }
    return curve([s, ...(data?.via ?? []), t])
  })
</script>

<BaseEdge {id} {path} {markerEnd} {style} />
