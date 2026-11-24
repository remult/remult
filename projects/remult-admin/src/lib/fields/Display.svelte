<script lang="ts">
  import type { FieldUIInfo } from '../../../../core/server/remult-admin'
  import Icon from '../shell/Icon.svelte'
  import { display } from '../table/format.js'

  let {
    field,
    value,
    caption,
  }: { field: FieldUIInfo; value: unknown; caption?: unknown } = $props()

  const d = $derived(display(field, value, caption))
</script>

{#if d.kind === 'empty'}
  <span class="empty">{d.text}</span>
{:else if d.kind === 'boolean'}
  {#if d.value}
    <span class="bool" title="true"
      ><Icon name="check" size={14} stroke={2} /><span class="sr-only"
        >true</span
      ></span
    >
  {:else}
    <span class="bool off" title="false">false</span>
  {/if}
{:else if d.kind === 'color'}
  <span class="color"
    ><span class="swatch" style:background={d.text}></span>{d.text}</span
  >
{:else if d.kind === 'relation'}
  <span class="text" class:missing={d.missing} title={d.title}>{d.text}</span>
{:else}
  <span class="text" class:mono={d.kind === 'json'} title={d.title}
    >{d.text}</span
  >
{/if}

<style>
  .text {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .mono {
    font-family: var(--mono);
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
  .missing {
    color: var(--text-faint);
    font-family: var(--mono);
    font-size: var(--text-sm);
  }
  .empty {
    color: var(--text-faint);
    font-family: var(--mono);
    font-size: var(--text-xs);
  }
  .bool {
    display: inline-flex;
    vertical-align: middle;
    color: var(--success);
  }
  .bool.off {
    color: var(--text-faint);
    font-size: var(--text-sm);
  }
  .color {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--mono);
    font-size: var(--text-sm);
  }
  .swatch {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    box-shadow: inset 0 0 0 1px oklch(0 0 0 / 0.1);
  }
</style>
