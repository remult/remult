<script lang="ts">
  import type { FieldUIInfo } from '../../../../core/server/remult-admin'
  import { settings } from '../core/settings.svelte.js'
  import Icon from '../shell/Icon.svelte'
  import { modKey } from '../shell/shell.svelte.js'
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
    editable,
    busy = false,
    errors,
    ondelete,
    onsave,
    oncancel,
    onedit,
    onopen,
  }: {
    row: TableRow
    fields: FieldUIInfo[]
    captions: Record<string, Map<unknown, unknown>>
    canUpdate: boolean
    canDelete: boolean
    resolved: boolean
    /** Inline mode: cells are editors when the row may change. */
    editable: boolean
    busy?: boolean
    errors?: Record<string, string>
    ondelete: (row: TableRow) => Promise<void>
    onsave: (row: TableRow) => void
    oncancel: (row: TableRow) => void
    onedit: (row: TableRow, key: string) => void
    /** Drawer mode: opens the row in the drawer. */
    onopen?: (row: TableRow) => void
  } = $props()

  let armed = $state(false)
  let deleting = $state(false)
  let disarm: ReturnType<typeof setTimeout> | undefined

  const isNew = $derived(!!row.isNew)
  const dirty = $derived(isNew || row.draft.dirty)
  const canEdit = $derived(editable && (isNew || canUpdate))
  const invalid = $derived(!!errors && Object.keys(errors).length > 0)

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

<tr
  class="row"
  data-row={row.id}
  data-dirty={dirty ? '' : undefined}
  data-new={isNew ? '' : undefined}
  data-readonly={isNew || canUpdate ? undefined : ''}
  aria-busy={deleting || busy || undefined}
>
  <td class="gutter">
    {#if isNew}
      <span class="mark new" title="New row, not saved yet"><Icon name="plus" size={12} stroke={2} /><span class="sr-only">New row</span></span>
    {:else if dirty}
      <span class="mark" class:invalid title={invalid ? 'Not saved: check the highlighted cells' : 'Edited, not saved yet'}>
        <span class="dot"></span><span class="sr-only">{invalid ? 'Not saved, has errors' : 'Edited'}</span>
      </span>
    {:else if resolved && !canUpdate}
      <span class="lock" title="Read only"><Icon name="lock" size={12} /><span class="sr-only">Read only</span></span>
    {/if}
  </td>
  {#each fields as f (f.key)}
    {@const k = valueKey(f)}
    <Cell
      field={f}
      bind:value={() => row.draft.values[k], (v) => (row.draft.values[k] = v)}
      caption={f.relationToOne ? captions[f.valFieldKey]?.get(row.draft.values[k]) : undefined}
      editable={canEdit}
      {busy}
      dirty={!isNew && row.draft.isDirty(k)}
      error={errors?.[k]}
      onedit={() => onedit(row, k)}
    />
  {/each}
  <td class="actions">
    {#if dirty && canEdit}
      <div class="pending">
        <button
          class="btn"
          data-variant="primary"
          type="button"
          title={`Save row (${modKey}+Enter, +Shift for all)`}
          disabled={busy}
          onclick={() => onsave(row)}
        >
          <Icon name="check" size={14} stroke={2} />{isNew ? 'Add' : 'Save'}
        </button>
        <button
          class="btn"
          data-variant="ghost"
          data-icon
          type="button"
          aria-label={isNew ? 'Discard new row' : 'Cancel changes'}
          title={`${isNew ? 'Discard' : 'Cancel'} (Esc, Shift+Esc for all)`}
          disabled={busy}
          onclick={() => oncancel(row)}
        >
          <Icon name="x" size={14} />
        </button>
      </div>
    {:else}
      {#if onopen && !isNew}
        <button class="btn open" data-variant="ghost" data-icon type="button" aria-label="Open row" title="Open row" onclick={() => onopen(row)}>
          <Icon name="panel-open" size={14} />
        </button>
      {/if}
      {#if canDelete && !isNew}
      <button
        class="btn delete"
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
    {/if}
  </td>
</tr>

<style>
  .row {
    transition: opacity 150ms var(--ease-out);
  }
  .row:hover > :global(td:not([data-dirty], [data-invalid])) {
    background: var(--bg-hover);
  }
  .row[data-new] > :global(td:not([data-invalid])) {
    background: color-mix(in oklch, var(--accent) 5%, var(--bg));
  }
  .row[aria-busy='true'] {
    opacity: 0.6;
  }
  .gutter {
    width: 28px;
    padding: 0 0 0 10px;
  }
  .lock,
  .mark {
    display: flex;
    color: var(--text-faint);
  }
  .mark {
    color: var(--accent);
  }
  .dot {
    width: 7px;
    height: 7px;
    margin-inline-start: 2px;
    border-radius: 50%;
    background: currentColor;
  }
  .mark.invalid {
    color: var(--danger);
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
  .row[data-dirty] > .actions {
    box-shadow: -1px 0 0 var(--border);
  }
  .pending {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 2px;
  }
  .pending .btn {
    height: 22px;
    font-size: var(--text-sm);
  }
  .pending .btn[data-variant='primary'] {
    gap: 4px;
    padding: 0 8px 0 6px;
  }
  .pending .btn[data-icon] {
    width: 22px;
  }
  .open {
    width: 24px;
    height: 24px;
  }
  .delete {
    height: 24px;
    opacity: 0;
    transition-property: opacity, background-color, color, scale;
  }
  .delete[data-icon] {
    width: 24px;
  }
  .row:hover .delete,
  .delete:focus-visible,
  .delete[data-armed] {
    opacity: 1;
  }
  .delete[data-variant='ghost']:hover {
    color: var(--danger);
    background: var(--danger-soft);
  }
  .delete[data-armed] {
    border-color: transparent;
    background: var(--danger-soft);
    font-size: var(--text-sm);
    padding: 0 8px;
  }
  @media (hover: none) {
    .delete {
      opacity: 1;
    }
  }
</style>
