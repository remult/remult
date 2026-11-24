<script lang="ts">
  import '@xyflow/svelte/dist/style.css'
  import { goto } from '$app/navigation'
  import {
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    SvelteFlow,
    type EdgeMarker,
    type NodeTypes,
  } from '@xyflow/svelte'
  import { untrack } from 'svelte'
  import { god } from '#lib/core/god.svelte.js'
  import { arrangeSchema, settings } from '#lib/core/settings.svelte.js'
  import EntityNodeView from '#lib/schema/EntityNode.svelte'
  import {
    edgesFor,
    layoutEntities,
    type DiagramLayout,
    type EntityNode,
    type XY,
  } from '#lib/schema/layout.js'
  import Icon from '#lib/shell/Icon.svelte'

  const nodeTypes: NodeTypes = { entity: EntityNodeView }
  const layouts: { value: DiagramLayout; label: string; title: string }[] = [
    {
      value: 'grid-dfs',
      label: 'Grid',
      title: 'Grid, related entities in depth-first order',
    },
    {
      value: 'grid-bfs',
      label: 'Grid (wide)',
      title: 'Grid, related entities in breadth-first order',
    },
    { value: 'line', label: 'Line', title: 'One row' },
  ]

  let nodes: EntityNode[] = $state.raw([])
  let hovered: string | undefined = $state()
  // a new flow fits the view again
  let version = $state(0)

  function relayout() {
    nodes = layoutEntities(
      god.visibleTables,
      settings.diagramLayout,
      settings.schemaPositions,
    ).nodes
  }

  let laidOut = false
  // also follows the Settings dialog, which can change the layout over this page
  $effect(() => {
    void god.visibleTables
    void settings.diagramLayout
    untrack(() => {
      relayout()
      if (laidOut) version++
      laidOut = true
    })
  })

  const edges = $derived.by(() => {
    const positions: Record<string, XY> = {}
    for (const n of nodes) positions[n.id] = n.position
    return edgesFor(god.visibleTables, positions).map((e) => {
      if (!hovered || (e.source !== hovered && e.target !== hovered)) return e
      const markerEnd = {
        ...(e.markerEnd as EdgeMarker),
        color: 'var(--accent)',
      }
      return { ...e, class: `${e.class} active`, markerEnd }
    })
  })

  function reset() {
    settings.schemaPositions = {}
    relayout()
    version++
  }

  function save(moved: EntityNode[]) {
    for (const n of moved)
      settings.schemaPositions[n.id] = {
        x: Math.round(n.position.x),
        y: Math.round(n.position.y),
      }
  }

  const hasSaved = $derived(Object.keys(settings.schemaPositions).length > 0)
</script>

<section class="schema">
  <header class="bar">
    <h1><Icon name="schema" size={16} />Schema</h1>
    <span class="count"
      >{god.visibleTables.length}
      {god.visibleTables.length === 1 ? 'entity' : 'entities'}</span
    >
    <div class="spacer"></div>
    <div class="segmented" role="radiogroup" aria-label="Layout">
      {#each layouts as l (l.value)}
        <label
          class="seg"
          title={l.title}
          data-checked={settings.diagramLayout === l.value ? '' : undefined}
        >
          <input
            type="radio"
            name="schema-layout"
            value={l.value}
            checked={settings.diagramLayout === l.value}
            onchange={() => arrangeSchema(l.value)}
          />
          {l.label}
        </label>
      {/each}
    </div>
    <button
      class="btn"
      type="button"
      disabled={!hasSaved}
      title="Forget moved positions"
      onclick={reset}
    >
      <Icon name="refresh" size={14} /> Reset layout
    </button>
  </header>

  <div class="canvas">
    {#if nodes.length === 0}
      <div class="empty">
        <span class="empty-icon"><Icon name="schema" size={20} /></span>
        <p>No entities to show.</p>
      </div>
    {:else}
      {#key version}
        <SvelteFlow
          bind:nodes
          {edges}
          {nodeTypes}
          fitView
          fitViewOptions={{ padding: 40, maxZoom: 1 }}
          minZoom={0.1}
          maxZoom={1.75}
          snapGrid={[8, 8]}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elementsSelectable
          deleteKey={null}
          defaultEdgeOptions={{ type: 'smoothstep', selectable: false }}
          onnodeclick={({ node, event }) => {
            // the header link navigates by itself
            if ((event.target as Element | null)?.closest('a')) return
            goto(`#/entity/${node.id}`)
          }}
          onnodedragstop={({ nodes: moved }) => save(moved)}
          onnodepointerenter={({ node }) => (hovered = node.id)}
          onnodepointerleave={() => (hovered = undefined)}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1.25} />
          <Controls showLock={false} />
          <MiniMap
            pannable
            zoomable
            width={168}
            height={112}
            nodeColor={(n) =>
              `oklch(var(--hue-l) var(--hue-c) ${(n as EntityNode).data.color})`}
            nodeBorderRadius={6}
          />
        </SvelteFlow>
      {/key}
    {/if}
  </div>
</section>

<style>
  .schema {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    min-height: 48px;
    padding: 8px 16px 8px 20px;
    border-bottom: 1px solid var(--border);
  }
  h1 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: var(--text-lg);
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  h1 :global(svg) {
    color: var(--text-muted);
  }
  .count {
    color: var(--text-faint);
    font-size: var(--text-sm);
  }
  .spacer {
    flex: 1;
  }
  .segmented {
    display: inline-flex;
    padding: 2px;
    border-radius: 7px;
    background: var(--bg-inset);
    box-shadow: inset 0 0 0 1px var(--border);
  }
  .seg {
    position: relative;
    display: inline-flex;
    align-items: center;
    height: 22px;
    padding: 0 9px;
    border-radius: 5px;
    color: var(--text-muted);
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
    transition:
      background-color 120ms var(--ease-out),
      color 120ms var(--ease-out);
  }
  .seg:hover {
    color: var(--text);
  }
  .seg[data-checked] {
    background: var(--bg-raised);
    color: var(--text);
    box-shadow:
      0 0 0 1px var(--border),
      0 1px 2px oklch(0 0 0 / 0.08);
  }
  .seg:has(:focus-visible) {
    outline: 2px solid var(--ring);
    outline-offset: 1px;
  }
  .seg input {
    position: absolute;
    inset: 0;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }
  .canvas {
    position: relative;
    flex: 1;
    min-height: 0;
    background: var(--bg-inset);
  }
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 100%;
    color: var(--text-muted);
  }
  .empty-icon {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--bg-raised);
    box-shadow: inset 0 0 0 1px var(--border);
  }

  /* xyflow on our tokens: one set, so dark mode follows the app theme */
  .canvas :global(.svelte-flow) {
    --xy-background-color: var(--bg-inset);
    --xy-background-pattern-color: color-mix(
      in oklch,
      var(--text-faint) 45%,
      transparent
    );
    --xy-edge-stroke: color-mix(in oklch, var(--text-faint) 70%, transparent);
    --xy-edge-stroke-width: 1.5;
    --xy-node-border-radius: var(--radius-lg);
    --xy-minimap-background-color: var(--bg-raised);
    --xy-minimap-mask-background-color: color-mix(
      in oklch,
      var(--bg-inset) 70%,
      transparent
    );
    --xy-minimap-mask-stroke-color: var(--border-strong);
    --xy-controls-button-background-color: var(--bg-raised);
    --xy-controls-button-background-color-hover: var(--bg-hover);
    --xy-controls-button-color: var(--text-muted);
    --xy-controls-button-color-hover: var(--text);
    --xy-controls-button-border-color: var(--border);
    --xy-controls-box-shadow:
      0 0 0 1px var(--border), 0 2px 6px -2px oklch(0.2 0.02 260 / 0.12);
    --xy-attribution-background-color: transparent;
    color: var(--text);
    font-family: var(--font);
  }
  .canvas :global(.svelte-flow__node-entity) {
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
  }
  .canvas :global(.svelte-flow__node-entity.dragging) {
    cursor: grabbing;
  }
  .canvas :global(.svelte-flow__edge.to-many .svelte-flow__edge-path) {
    stroke-dasharray: 5 4;
  }
  .canvas :global(.svelte-flow__edge.active .svelte-flow__edge-path) {
    stroke: var(--accent);
    stroke-width: 2;
  }
  .canvas :global(.svelte-flow__controls) {
    border-radius: var(--radius);
    overflow: hidden;
  }
  .canvas :global(.svelte-flow__controls-button svg) {
    fill: currentColor;
  }
  .canvas :global(.svelte-flow__minimap) {
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow:
      0 0 0 1px var(--border),
      0 2px 6px -2px oklch(0.2 0.02 260 / 0.12);
  }
  .canvas :global(.svelte-flow__attribution a) {
    color: var(--text-faint);
  }
</style>
