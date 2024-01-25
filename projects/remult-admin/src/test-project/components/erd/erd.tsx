import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  Node,
  NodeChange,
  getIncomers,
  Edge,
} from 'reactflow'
import { God } from '../../God'
import 'reactflow/dist/style.css'

import { EntityNode } from './Entity'
import { useCallback, useEffect } from 'react'
import { EntityUIInfo } from '../../../lib/entity-info'

const initialNodes: Node<EntityUIInfo>[] = []
const initialEdges: Edge[] = []
const nodeTypes = { entity: EntityNode }

export function Erd({ god }: { god: God }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const handleNodesChange = useCallback(
    (nodeChanges: NodeChange[]) => {
      nodeChanges.forEach((nodeChange) => {
        if (nodeChange.type === 'position' && nodeChange.positionAbsolute) {
          // nodeChange.positionAbsolute contains new position
          const node = nodes.find((node) => node.id === nodeChange.id)

          if (!node) {
            return
          }
          setEdges((eds) =>
            eds.map((e) => {
              if (e.source === node.id) {
                return {
                  ...e,
                  ...returnHandles(
                    node!,
                    nodes.find((n) => n.id === e.target)!,
                    e.sourceHandle!,
                    e.targetHandle!
                  ),
                }
              } else if (e.target === node.id) {
                return {
                  ...e,
                  ...returnHandles(
                    nodes.find((n) => n.id === e.source)!,
                    node!,
                    e.sourceHandle!,
                    e.targetHandle!
                  ),
                }
              }

              return e
            })
          )
        }
      })

      onNodesChange(nodeChanges)
      localStorage.setItem(
        'erd',
        JSON.stringify(nodes.map((x) => ({ id: x.id, position: x.position })))
      )
    },
    [onNodesChange, setEdges, nodes, edges]
  )

  useEffect(() => {
    const nodes = god.tables.map((data, i) => ({
      id: data.key,
      position: { x: i * 150, y: 0 },
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
        const node = nodes.find((x) => x.id === savedNode.id)
        if (node) node.position = savedNode.position
      }
    }
    const edges: Edge[] = []
    setNodes(nodes)
    for (const entity of god.tables) {
      function createEdge(
        toEntity: string,
        relationFields: Record<string, string>
      ) {
        const target = god.tables.find((x) => x.key === toEntity)

        if (target) {
          const sourceNode = nodes.find((x) => x.id === entity.key)!
          const targetNode = nodes.find((x) => x.id === target.key)!
          for (const key in relationFields) {
            if (Object.prototype.hasOwnProperty.call(relationFields, key)) {
              const element = relationFields[key]
              edges.push({
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
          createEdge(field.relationToOne?.entityKey, field.relationToOne.fields)
        }
      }
      for (const relation of entity.relations) {
        const target = god.tables.find((x) => x.key === relation.entityKey)

        if (target) {
          createEdge(relation.entityKey, relation.fields)
        }
      }
    }
    console.table(edges)
    setEdges(edges)
  }, [god])
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onEdgesChange={onEdgesChange}
        onNodesChange={handleNodesChange}
        snapToGrid={true}
        fitView
        snapGrid={[16, 16]}
        nodeTypes={nodeTypes}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  )
}
function returnHandles(
  sourceNode: Node,
  targetNode: Node,
  sourceField: string,
  targetField: string
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
