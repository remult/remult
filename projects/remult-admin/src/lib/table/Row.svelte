<script lang="ts">
  import type { FieldUIInfo } from '../../../../core/server/remult-admin'
  import { settings } from '../core/settings.svelte.js'
  import Icon from '../shell/Icon.svelte'
  import Cell from './Cell.svelte'
  import { valueKey } from './format.js'
  import type { TableRow } from './table-data.svelte.js'

  let {
    row,
    fields,
    captions,
    canUpdate,
    canDelete,
    resolved,
    ondelete,
  }: {
    row: TableRow
    fields: FieldUIInfo[]
    captions: Record<string, Map<unknown, unknown>>
    canUpdate: boolean
    canDelete: boolean
    resolved: boolean
    ondelete: (row: TableRow) => Promise<void>
  } = $props()

  let armed = $state(false)
  let deleting = $state(false)
  let disarm: ReturnType<typeof setTimeout> | undefined

  async function onDelete() {
    if (settings.confirmDelete && !armed) {
      armed = true
      clearTimeout(disarm)
      disarm = setTimeout(() => (armed = false), 3000)
      return
    }
    clearTimeout(disarm)
    armed = false
    deleting = true
    try {
      await ondelete(row)
    } finally {
      deleting = false
    }
  }
</script>

<tr class="row" data-readonly={canUpdate ? undefined : ''} aria-busy={deleting || undefined}>
  <td class="gutter">
    {#if resolved && !canUpdate}
      <span class="lock" title="Read only"><Icon name="lock" size={12} /><span class="sr-only">Read only</span></span>
    {/if}
  </td>
  {#each fields as f (f.key)}
    {@const v = row.draft.values[valueKey(f)]}
    <Cell field={f} value={v} caption={f.relationToOne ? captions[f.valFieldKey]?.get(v) : undefined} />
  {/each}
  <td class="actions">
    {#if canDelete}
      <button
        class="btn"
        data-variant={armed ? 'danger' : 'ghost'}
        data-icon={armed ? undefined : ''}
        data-armed={armed ? '' : undefined}
        type="button"
        aria-label={armed ? 'Confirm delete' : 'Delete row'}
        title={armed ? undefined : 'Delete row'}
        disabled={deleting}
        onclick={onDelete}
        onblur={() => (armed = false)}
      >
        {#if armed}Delete?{:else}<Icon name="trash" size={14} />{/if}
      </button>
    {/if}
  </td>
</tr>

<style>
  .row {
    transition: opacity 150ms var(--ease-out);
  }
  .row:hover > :global(td) {
    background: var(--bg-hover);
  }
  .row[aria-busy='true'] {
    opacity: 0.5;
  }
  .gutter {
    width: 28px;
    padding: 0 0 0 10px;
  }
  .lock {
    display: flex;
    color: var(--text-faint);
  }
  .actions {
    position: sticky;
    right: 0;
    width: 1%;
    padding: 0 6px;
    background: var(--bg);
    text-align: end;
    white-space: nowrap;
  }
  .actions .btn {
    height: 24px;
    opacity: 0;
    transition-property: opacity, background-color, color, scale;
  }
  .actions .btn[data-icon] {
    width: 24px;
  }
  .row:hover .actions .btn,
  .actions .btn:focus-visible,
  .actions .btn[data-armed] {
    opacity: 1;
  }
  .actions .btn[data-variant='ghost']:hover {
    color: var(--danger);
    background: var(--danger-soft);
  }
  .actions .btn[data-armed] {
    border-color: transparent;
    background: var(--danger-soft);
    font-size: var(--text-sm);
    padding: 0 8px;
  }
  @media (hover: none) {
    .actions .btn {
      opacity: 1;
    }
  }
</style>
