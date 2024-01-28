<script lang="ts">
  import { Handle, Position, useNodes, type NodeProps } from '@xyflow/svelte'

  type $$Props = NodeProps

  // Needed to not get warning about prop set on component
  $$restProps

  export let data: $$Props['data']
</script>

<div class="entity-node">
  <div class="entity-name">{data.caption}</div>
  <div class="entity-fields">
    {#each data.fields as f}
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
    {/each}
  </div>
</div>

<style>
  .entity-node {
    --entity-color: rgb(145, 196, 242);
    border: 1px solid var(--entity-color);

    border-radius: 4px;
    background: white;
  }
  .entity-name {
    position: relative;
    padding: 8px;
    background-color: var(--entity-color);
    border: 0;
    border-radius: 4px 4px 0 0;

    font-weight: bold;
    text-align: center;
  }
  .entity-fields {
    border: 1px solid #cbd2d9;
    border-top: 0;
    border-radius: 0 0 4px 4px;
  }

  .entity-field {
    position: relative;
    padding: 8px;
    border-bottom: 1px solid #cbd2d9;
  }
</style>
