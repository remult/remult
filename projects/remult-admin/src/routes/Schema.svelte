<script lang="ts">
  import { writable } from 'svelte/store'
  import {
    SvelteFlow,
    Background,
    Controls,
    MiniMap,
    type Node,
    type NodeTypes,
    type Edge,
  } from '@xyflow/svelte'

  import '@xyflow/svelte/dist/style.css'

  import { godStore } from '../stores/GodStore'
  import EntityNode from '../components/flow/EntityNode.svelte'

  const nodes = writable<Node[]>([])
  const edges = writable<Edge[]>([])

  const nodeTypes: NodeTypes = {
    entity: EntityNode,
  }

  $: $godStore && init()

  const init = () => {
    const localNodes = $godStore.tables.map((data, i) => ({
      id: data.repo.metadata.key,
      position: { x: i * 300, y: 0 },
      data,
      type: 'entity',
    }))

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
                // markerEnd: {
                //   type: 'arrow',
                // },
              })
            }
          }
        }
      }
      for (const field of entity.fields) {
        if (field.relationToOne) {
          createEdge(field.relationToOne?.entityKey, field.relationToOne.fields)
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
    console.table(localEdges)
    edges.set(localEdges)
  }

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
  <SvelteFlow {nodes} {edges} {nodeTypes} fitView snapGrid={[16, 16]}>
    <Background patternColor="#aaa" gap={16} />
    <Controls />
    <MiniMap zoomable pannable height={120} />
  </SvelteFlow>
</div>
