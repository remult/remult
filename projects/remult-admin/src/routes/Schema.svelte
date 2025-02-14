<script lang="ts">
  import { run } from 'svelte/legacy';

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
  import EntityNode from '../lib/ui/flow/EntityNode.svelte'
  import { LSContext, type TLSContext } from '../lib/stores/LSContext.js'
  import { type God, type TableInfo } from '../God.js'

  const nodes = writable<Node[]>([])
  const edges = writable<Edge[]>([])

  const nodeTypes: NodeTypes = {
    entity: EntityNode,
  }


  const init = (god: God, ctx: TLSContext) => {
    const layoutType: 'grid-dfs' | 'grid-bfs' | 'line' =
      $LSContext.settings.diagramLayoutAlgorithm

    const tables = god.getTables(ctx)
    const groups = groupTablesByRelations(layoutType, tables)
    const magicNumber = Math.ceil(Math.sqrt(tables.length + tables.length))

    const localNodes = []
    const columnHeights = Array(magicNumber).fill(0) // Initialize heights for each of the 5 columns
    let index = 0

    groups.forEach((group) => {
      group.forEach((data) => {
        const found = $LSContext.schema?.[data.key]
        let position

        if (found) {
          position = {
            x: $LSContext.schema[data.key].x,
            y: $LSContext.schema[data.key].y,
          }
        } else {
          position = getPosition(
            index,
            data.fields.length,
            layoutType,
            columnHeights,
          )
          $LSContext.schema = {
            ...$LSContext.schema,
            [data.key]: {
              x: position.x,
              y: position.y,
            },
          }
          index++
        }

        localNodes.push({
          id: data.repo.metadata.key,
          position,
          data,
          type: 'entity',
        })
      })
    })

    nodes.set(localNodes)

    updateNodesEdges()
  }

  function groupTablesByRelations(
    style: 'grid-bfs' | 'grid-dfs' | 'line',
    tables: TableInfo[],
  ) {
    const groups = []
    const visited = new Set()

    tables.forEach((table) => {
      if (!visited.has(table.key)) {
        const group = []
        if (style === 'grid-dfs') {
          dfs(table, group, visited)
        } else {
          bfs(table, group, visited)
        }
        groups.push(group)
      }
    })

    return groups
  }

  function bfs(startTable, group, visited) {
    const queue = [startTable]

    while (queue.length > 0) {
      const table = queue.shift()
      if (!visited.has(table.key)) {
        visited.add(table.key)
        group.push(table)

        table.fields.forEach((field) => {
          if (field.relationToOne) {
            const relatedTable = $godStore
              .getTables($LSContext)
              .find((x) => x.key === field.relationToOne.entityKey)
            if (relatedTable && !visited.has(relatedTable.key)) {
              queue.push(relatedTable)
            }
          }
        })

        table.relations.forEach((relation) => {
          const relatedTable = $godStore
            .getTables($LSContext)
            .find((x) => x.key === relation.entityKey)
          if (relatedTable && !visited.has(relatedTable.key)) {
            queue.push(relatedTable)
          }
        })
      }
    }
  }

  function dfs(table, group, visited) {
    visited.add(table.key)
    group.push(table)

    table.fields.forEach((field) => {
      if (field.relationToOne) {
        const relatedTable = $godStore
          .getTables($LSContext)
          .find((x) => x.key === field.relationToOne.entityKey)
        if (relatedTable && !visited.has(relatedTable.key)) {
          dfs(relatedTable, group, visited)
        }
      }
    })

    table.relations.forEach((relation) => {
      const relatedTable = $godStore
        .getTables($LSContext)
        .find((x) => x.key === relation.entityKey)
      if (relatedTable && !visited.has(relatedTable.key)) {
        dfs(relatedTable, group, visited)
      }
    })
  }

  function getPosition(
    index: number,
    numRows: number,
    layoutType: 'grid-bfs' | 'grid-dfs' | 'line',
    columnHeights: number[],
  ) {
    switch (layoutType) {
      case 'grid-dfs':
        return getGridPosition(numRows, columnHeights)
      case 'grid-bfs':
        return getGridPosition(numRows, columnHeights)
      default:
        return { x: index * 300, y: 0 }
    }
  }

  function getGridPosition(numRows: number, columnHeights: number[]) {
    const rowHeight = 40 // Height per row, adjust as needed
    const columnWidth = 400
    const extraSpace = 200 // Additional space between tables

    // Find the column with the minimum height
    const minHeightColumn = columnHeights.indexOf(Math.min(...columnHeights))

    // Calculate the position based on the column with the minimum height
    const x = minHeightColumn * columnWidth
    const y = columnHeights[minHeightColumn]

    // Update the height of the column with the added table height
    columnHeights[minHeightColumn] += numRows * rowHeight + extraSpace

    return { x, y }
  }

  function updateNodesEdges() {
    for (const entity of $godStore.getTables($LSContext)) {
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
        const target = $godStore
          .getTables($LSContext)
          .find((x) => x.key === relation.entityKey)

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
    const target = $godStore
      .getTables($LSContext)
      .find((x) => x.key === toEntity)

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
  run(() => {
    $godStore && $LSContext && init($godStore, $LSContext)
  });
</script>

<div style="height:100vh;">
  <SvelteFlow
    {nodes}
    {edges}
    {nodeTypes}
    fitView
    snapGrid={[16, 16]}
    minZoom={0.01}
    on:nodedrag={nodedrag}
    on:nodedragstop={nodedragstop}
  >
    <Background patternColor="#aaa" gap={16} />
    <Controls />
    <MiniMap zoomable pannable height={120} />
  </SvelteFlow>
</div>
