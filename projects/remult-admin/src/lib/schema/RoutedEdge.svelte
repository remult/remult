<script lang="ts">
  import { BaseEdge, type EdgeProps } from '@xyflow/svelte'
  import type { Edge } from '@xyflow/svelte'
  import { orthoPath, routePoints, type RoutedEdgeData } from './layout.js'

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

  // a self relation loops out to the right and back
  const path = $derived.by(() => {
    const s = { x: sourceX, y: sourceY }
    const t = { x: targetX, y: targetY }
    if (Math.abs(s.x - t.x) < 1) {
      const out = s.x + 32
      return orthoPath([s, { x: out, y: s.y }, { x: out, y: t.y }, t])
    }
    return orthoPath(routePoints(s, t, data ?? {}))
  })
</script>

<BaseEdge {id} {path} {markerEnd} {style} />
