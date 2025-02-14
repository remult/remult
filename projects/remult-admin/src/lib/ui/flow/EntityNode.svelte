<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte'
  import { LSContext } from '../../stores/LSContext.js'
  import ColumnType from '../../icons/ColumnType.svelte'
  import type { FieldUIInfo } from '../../../../../core/server/remult-admin.js'
  import Key from '../../icons/Key.svelte'

  // type $$Props = NodeProps

  // interface Props {
  //   data: $$Props['data']
  //   [key: string]: any
  // }

  let {
    data,
  } //  position, selected
  : NodeProps = $props()

  const getFields = () => {
    return data.fields as FieldUIInfo[]
  }
</script>

<div class="entity-node" style="--color: {data.color}">
  <div class="entity-name">{data.caption}</div>
  <div class="entity-fields">
    {#each getFields() as f}
      <div class="entity-field">
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
        <span
          style="display: flex; justify-content: space-between; {Object.keys(
            data.ids,
          ).includes(f.key)
            ? 'font-weight: bold;'
            : ''}"
        >
          {$LSContext.settings.dispayCaption ? f.caption : f.key}
          <span>
            {#if Object.keys(data.ids).includes(f.key)}
              <Key></Key>
            {/if}
            <ColumnType type={f.type} isSelect={f.values && f.values.length > 0}
            ></ColumnType>
          </span>
        </span>
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
    {/each}
  </div>
</div>

<style>
  .entity-fields {
    border: 1px solid #cbd2d9;
    border-top: 0;
    border-radius: 0 0 4px 4px;
  }

  .entity-node {
    --entity-color: rgb(145, 196, 242);

    border-radius: 4px;
    background: white;
    box-shadow:
      0 4px 6px -1px rgb(0 0 0 / 0.1),
      0 2px 4px -2px rgb(0 0 0 / 0.1);
    border-top: 8px solid hsla(var(--color), 70%, 50%, 1);
    min-width: 200px;
  }
  .entity-node:hover {
    box-shadow:
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1);
  }

  .entity-name {
    position: relative;
    padding: 8px;
    background-color: #f8fafc;
    border: 1px solid rgb(203 213 225);
    font-size: 1.25rem;
    line-height: 1.75rem;
    font-weight: 400;
    text-align: center;
  }

  .entity-field {
    position: relative;
    padding: 8px;
    font-size: 0.9rem;
    color: rgb(96 111 123);
    padding-inline-start: 16px;
  }
  .entity-field:hover {
    background: rgb(245 247 250);
  }

  :global(.svelte-flow__handle.connectionindicator) {
    visibility: hidden;
  }
</style>
