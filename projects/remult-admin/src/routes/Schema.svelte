<script lang="ts">
  import { writable } from 'svelte/store'
  import {
    SvelteFlow,
    Background,
    Controls,
    MiniMap,
    SvelteFlowProvider,
    type Node,
    type NodeTypes,
    type Edge,
  } from '@xyflow/svelte'

  import '@xyflow/svelte/dist/style.css'

  import { godStore } from '../stores/GodStore'
  import EntityNode from '../components/flow/EntityNode.svelte'
  import { calcOptimisedDefaultPlacement } from '../components/flow/calc'

  const nodes = writable<Node[]>([])
  const edges = writable<Edge[]>([])

  const nodeTypes: NodeTypes = {
    entity: EntityNode,
  }

  $effect(() => {
    if ($godStore) {
      const data = calcOptimisedDefaultPlacement($godStore)
      // console.log(`data`, data)

      const localNodes = data.map((data, i) => ({
        id: data.table.key,
        position: data.position,
        data: data.table,
        type: 'entity',
      }))
      // const localNodes = $godStore.tables.map((data, i) => ({
      //   id: data.key,
      //   position: { x: i * 150, y: 0 },
      //   data,
      //   type: 'entity',
      // }))
      const saved = localStorage.getItem('erd')
      if (saved) {
        const savedNodes = JSON.parse(saved) as {
          id: string
          position: { x: number; y: number }
        }[]
        for (const savedNode of savedNodes) {
          const node = localNodes.find((x) => x.id === savedNode.id)
          if (node) node.position = savedNode.position
        }
      }
      nodes.set(localNodes)

      const localEdges: Edge[] = []

      for (const entity of $godStore.tables) {
        function createEdge(
          toEntity: string,
          relationFields: Record<string, string>,
        ) {
          const target = $godStore.tables.find((x) => x.key === toEntity)

          if (target) {
            const sourceNode = localNodes.find((x) => x.id === entity.key)!
            const targetNode = localNodes.find((x) => x.id === target.key)!
            for (const key in relationFields) {
              if (Object.prototype.hasOwnProperty.call(relationFields, key)) {
                const element = relationFields[key]
                localEdges.push({
                  id: `${entity.key}-${element}-to-one`,
                  source: sourceNode.id,
                  target: targetNode.id,
                  ...returnHandles(sourceNode, targetNode, element, key),
                })
              }
            }
          }
        }
        for (const field of entity.fields) {
          if (field.relationToOne) {
            createEdge(
              field.relationToOne?.entityKey,
              field.relationToOne.fields,
            )
          }
        }
        for (const relation of entity.relations) {
          const target = $godStore.tables.find(
            (x) => x.key === relation.entityKey,
          )

          if (target) {
            createEdge(relation.entityKey, relation.fields)
          }
        }
      }
      // console.table(localEdges)
      edges.set(localEdges)
    }
  })

  function returnHandles(
    sourceNode: Node,
    targetNode: Node,
    sourceField: string,
    targetField: string,
  ) {
    return {
      sourceHandle:
        cleanField(sourceField) +
        '-source-' +
        (sourceNode.position.x > targetNode.position.x ? 'left' : 'right'),
      targetHandle:
        cleanField(targetField) +
        '-target-' +
        (sourceNode.position.x > targetNode.position.x ? 'right' : 'left'),
    }
  }

  function cleanField(id: string) {
    const sp = id.split('-')
    if (sp[sp.length - 2] === 'source' || sp[sp.length - 2] === 'target')
      return sp.slice(0, sp.length - 2).join('-')
    return id
  }
</script>

<div style="height:100vh;">
  {#if $nodes.length > 0}
    <SvelteFlowProvider>
      <SvelteFlow {nodes} {edges} {nodeTypes} fitView>
        <Background patternColor="#aaa" gap={16} />
        <Controls />
        <MiniMap zoomable pannable height={120} />
      </SvelteFlow>
    </SvelteFlowProvider>
  {:else}
    Building the diagram...
  {/if}
</div>

<style>
  :global(.svelte-flow__node.custom-style) {
    background: #63b3ed;
    color: white;
    width: 100;
  }

  :global(.svelte-flow__node.circle) {
    background: #2b6cb0;
    color: white;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: 700;
  }

  :global(.annotation) {
    border-radius: 0;
    text-align: left;
    background: white;
    border: none;
    line-height: 1.4;
    width: 225px;
    box-shadow:
      0 4px 6px -1px rgb(0 0 0 / 15%),
      0 2px 4px -1px rgb(0 0 0 / 8%);
  }

  :global(.annotation .svelte-flow__handle) {
    display: none;
  }
</style>
