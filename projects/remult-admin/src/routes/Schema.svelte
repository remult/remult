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
    MarkerType,
  } from '@xyflow/svelte'

  import '@xyflow/svelte/dist/style.css'

  import { godStore } from '../stores/GodStore'
  import EntityNode from '../components/flow/EntityNode.svelte'
  import { LSContext } from '../lib/LSContext.js'

  const nodes = writable<Node[]>([])
  const edges = writable<Edge[]>([])

  const nodeTypes: NodeTypes = {
    entity: EntityNode,
  }

  $: $godStore && init()

  const init = () => {
    const localNodes = $godStore.tables.map((data, i) => {
      const found = $LSContext.schema?.[data.key]

      let position = { x: i * 300, y: 0 }

      if (found) {
        position = {
          x: $LSContext.schema[data.key].x,
          y: $LSContext.schema[data.key].y,
        }
      } else {
        $LSContext.schema = {
          ...$LSContext.schema,
          [data.key]: {
            x: position.x,
            y: position.y,
          },
        }
      }

      return {
        id: data.repo.metadata.key,
        position,
        data,
        type: 'entity',
      }
    }) as unknown as Node[]

    nodes.set(localNodes)

    updateNodesEdges()
  }

  function updateNodesEdges() {
    for (const entity of $godStore.tables) {
      for (const field of entity.fields) {
        if (field.relationToOne) {
          createEdge(
            entity,
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
          createEdge(entity, relation.entityKey, relation.fields)
        }
      }
    }
  }

  function createEdge(
    entity: (typeof $godStore.tables)[0],
    toEntity: string,
    relationFields: Record<string, string>,
  ) {
    const target = $godStore.tables.find((x) => x.key === toEntity)

    if (target) {
      const sourceNode = $nodes.find((x) => x.id === entity.key)!
      const targetNode = $nodes.find((x) => x.id === target.key)!
      let i = 0
      const localEdges: Edge[] = []
      for (const key in relationFields) {
        if (Object.prototype.hasOwnProperty.call(relationFields, key)) {
          const element = relationFields[key]
          localEdges.push({
            id: `${entity.key}-${element}-to-one-${sourceNode.id}-${targetNode.id}`,
            source: sourceNode.id,
            target: targetNode.id,
            ...returnHandles(sourceNode, targetNode, element, key),
            // animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              strokeWidth: 4,
            },
          })
        }
        i++
      }
      $edges = [
        ...$edges.filter((c) => !localEdges.map((d) => d.id).includes(c.id)),
        ...localEdges,
      ]
    }
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

  const nodedrag = (
    e: CustomEvent<{
      event: MouseEvent
      targetNode: Node | null
      nodes: Node[]
    }>,
  ) => {
    updateNodesEdges()
  }

  const nodedragstop = (
    e: CustomEvent<{
      event: MouseEvent
      targetNode: Node | null
      nodes: Node[]
    }>,
  ) => {
    $LSContext.schema = {
      ...$LSContext.schema,
      [e.detail.targetNode.id]: {
        x: e.detail.targetNode.position.x,
        y: e.detail.targetNode.position.y,
      },
    }
  }
</script>

<div style="height:100vh;">
  <SvelteFlow
    {nodes}
    {edges}
    {nodeTypes}
    fitView
    snapGrid={[16, 16]}
    on:nodedrag={nodedrag}
    on:nodedragstop={nodedragstop}
  >
    <Background patternColor="#aaa" gap={16} />
    <Controls />
    <MiniMap zoomable pannable height={120} />
  </SvelteFlow>
</div>
