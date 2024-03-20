import { FC, useCallback } from 'react'
import { Handle, NodeProps, Position } from 'reactflow'
import './Entity.css'
import { EntityUIInfo } from '../../../../core/server/remult-admin'

const colors = [
  'rgb(101, 116, 205)',
  'rgb(149, 97, 226)',
  'rgb(246, 109, 155)',
  'rgb(184, 194, 204)',
  'rgb(227, 52, 47)',
  'rgb(246, 153, 63)',
  'rgb(255, 237, 74)',
  'rgb(56, 193, 114)',
  'rgb(132, 204, 22)',
  'rgb(77, 192, 181)',
  'rgb(52, 144, 220)',
  'rgba(0, 0, 255, 0.45)',
]
export const EntityNode: FC<NodeProps<EntityUIInfo & { index: number }>> = ({
  data,
}) => {
  const color = () => {
    return colors[data.index % colors.length]
  }
  return (
    <div
      className="entity-node"
      style={{
        //@ts-ignore
        '--color': color(),
      }}
    >
      <div className="entity-name"> {data.caption}</div>
      <div className="entity-fields">
        {data.fields.map((f) => (
          <div key={f.key} className="entity-field">
            <Handle
              type="source"
              position={Position.Left}
              id={`${f.key}-source-left`}
            />
            <Handle
              type="target"
              position={Position.Left}
              id={`${f.key}-target-left`}
            />
            {f.caption}
            <Handle
              type="source"
              position={Position.Right}
              id={`${f.key}-source-right`}
            />
            <Handle
              type="target"
              position={Position.Right}
              id={`${f.key}-target-right`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
