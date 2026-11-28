<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte'
  import type { FieldUIInfo } from '../../../../core/server/remult-admin'
  import { god } from '../core/god.svelte.js'
  import { settings } from '../core/settings.svelte.js'
  import Icon, { type IconName } from '../shell/Icon.svelte'
  import MiddleText from '../shell/MiddleText.svelte'
  import { inRow, shownFields, type EntityNode } from './layout.js'

  let { data, selected }: NodeProps<EntityNode> = $props()

  // undefined for a moment after a reload drops the entity, until the page lays out again
  const table = $derived(god.bySuperKey(data.superKey))
  const shown = $derived(
    table ? shownFields(table, data.compact) : { fields: [], more: 0 },
  )
  // links arrive at the id row: a foreign key points at a key
  const pk = $derived(table && inRow(table, data.compact))
  const name = (x: { caption: string; key: string }) =>
    settings.displayCaption ? x.caption : x.key

  function typeIcon(f: FieldUIInfo): IconName {
    if (table?.ids[f.key]) return 'key'
    if (f.relationToOne) return 'relation'
    if (f.values.length) return 'list'
    if (f.type === 'number') return 'hash'
    if (f.type === 'boolean') return 'toggle'
    if (f.type === 'date') return 'calendar'
    if (f.type === 'json') return 'braces'
    return 'type'
  }

  function typeName(f: FieldUIInfo) {
    if (f.relationToOne) {
      const t = god.byKey(f.relationToOne.entityKey)
      return t ? name(t) : f.relationToOne.entityKey
    }
    if (f.values.length) return 'enum'
    if (f.type === 'date') return f.inputType === 'date' ? 'date' : 'datetime'
    return f.type
  }

  const manyName = (entityKey: string) => {
    const t = god.byKey(entityKey)
    return t ? name(t) : entityKey
  }
</script>

{#snippet inHandles()}
  <Handle
    type="target"
    position={Position.Left}
    id="in-l"
    isConnectable={false}
  />
  <Handle
    type="target"
    position={Position.Right}
    id="in-r"
    isConnectable={false}
  />
{/snippet}

{#if table}
  <div
    class="node"
    data-selected={selected ? '' : undefined}
    style:--hue={table.color}
  >
    {#if !pk}{@render inHandles()}{/if}
    <a
      class="head"
      href={`#/entity/${table.superKey}`}
      draggable="false"
      title={`Open ${name(table)}`}
    >
      <span class="hue-dot"></span>
      <span class="caption"><MiddleText text={name(table)} /></span>
      <span class="go"><Icon name="arrow-up-right" size={13} /></span>
    </a>
    <ul class="rows">
      {#each shown.fields as f (f.key)}
        <li
          class="row"
          data-id={table.ids[f.key] ? '' : undefined}
          data-relation={f.relationToOne ? '' : undefined}
        >
          <span class="icon"><Icon name={typeIcon(f)} size={13} /></span>
          <span class="name">{name(f)}</span>
          <span class="type">{typeName(f)}</span>
          {#if f.key === pk}{@render inHandles()}{/if}
          {#if f.relationToOne}
            <Handle
              type="source"
              position={Position.Left}
              id={`${f.key}-l`}
              isConnectable={false}
            />
            <Handle
              type="source"
              position={Position.Right}
              id={`${f.key}-r`}
              isConnectable={false}
            />
          {/if}
        </li>
      {/each}
      {#each table.relations as r (r.key)}
        <li class="row" data-relation data-many>
          <span class="icon"><Icon name="list" size={13} /></span>
          <span class="name">{name(r)}</span>
          <span class="type">{manyName(r.entityKey)}[]</span>
          <Handle
            type="source"
            position={Position.Left}
            id={`${r.key}-l`}
            isConnectable={false}
          />
          <Handle
            type="source"
            position={Position.Right}
            id={`${r.key}-r`}
            isConnectable={false}
          />
        </li>
      {/each}
      {#if shown.more}
        <li class="row more">
          <span class="icon"></span>
          <span class="name"
            >+{shown.more} {shown.more === 1 ? 'field' : 'fields'}</span
          >
        </li>
      {/if}
    </ul>
  </div>
{/if}

<style>
  .node {
    --tint: oklch(var(--hue-l) var(--hue-c) var(--hue));
    width: 248px;
    border-radius: var(--radius-lg);
    background: var(--bg-raised);
    color: var(--text);
    font-size: var(--text-sm);
    box-shadow:
      0 0 0 1px var(--border),
      0 1px 2px oklch(0.2 0.02 260 / 0.06),
      0 4px 12px -4px oklch(0.2 0.02 260 / 0.1);
    transition: box-shadow 150ms var(--ease-out);
  }
  .node:hover {
    box-shadow:
      0 0 0 1px var(--border-strong),
      0 2px 4px oklch(0.2 0.02 260 / 0.08),
      0 12px 24px -8px oklch(0.2 0.02 260 / 0.18);
  }
  .node[data-selected] {
    box-shadow:
      0 0 0 1.5px var(--tint),
      0 0 0 5px color-mix(in oklch, var(--tint) 18%, transparent),
      0 12px 24px -8px oklch(0.2 0.02 260 / 0.18);
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 38px;
    padding: 0 10px 0 12px;
    border-bottom: 1px solid var(--border);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    /* alpha, not color-mix: mixing with a neutral drags the hue toward its own */
    background: oklch(var(--hue-l) var(--hue-c) var(--hue) / 0.1);
    color: var(--text);
    font-size: var(--text-md);
    font-weight: 600;
    letter-spacing: -0.005em;
    text-decoration: none;
    cursor: pointer;
  }
  .head:focus-visible {
    outline-offset: -2px;
  }
  .caption {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .go {
    display: flex;
    color: var(--text-faint);
    opacity: 0;
    transition-property: opacity, color;
    transition-duration: 120ms;
    transition-timing-function: var(--ease-out);
  }
  .node:hover .go,
  .head:focus-visible .go {
    opacity: 1;
  }
  .head:hover .go {
    color: var(--text);
  }
  .rows {
    margin: 0;
    padding: 4px 0;
    list-style: none;
  }
  .row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 26px;
    padding: 0 12px;
  }
  .icon {
    display: flex;
    color: var(--text-faint);
  }
  .row.more .name {
    color: var(--text-faint);
    font-size: var(--text-xs);
  }
  .row[data-id] .icon {
    color: var(--warning);
  }
  .row[data-relation] .icon {
    color: var(--accent);
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .row[data-id] .name {
    font-weight: 600;
  }
  .type {
    max-width: 50%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-faint);
    font-family: var(--mono);
    font-size: var(--text-xs);
  }
  .row[data-relation] .type {
    color: var(--text-muted);
  }
  /* edges anchor here; nothing to connect by hand */
  .node :global(.svelte-flow__handle) {
    width: 1px;
    height: 1px;
    min-width: 0;
    min-height: 0;
    border: 0;
    background: transparent;
  }
  .node > :global(.svelte-flow__handle) {
    top: 19px;
  }
</style>
