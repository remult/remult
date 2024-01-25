import { FC } from 'react'
import { Handle, NodeProps, Position } from 'reactflow'
import './Entity.css'
import { EntityUIInfo } from '../../../lib/entity-info'

export const EntityNode: FC<NodeProps<EntityUIInfo>> = ({ data }) => {
  return (
    <div className="entity-node">
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
