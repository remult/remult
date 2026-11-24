<script lang="ts">
  import type { FieldUIInfo } from '../../../../core/server/remult-admin'
  import { settings } from '../core/settings.svelte.js'
  import Icon from '../shell/Icon.svelte'
  import { modKey } from '../shell/shell.svelte.js'
  import Cell from './Cell.svelte'
  import { valueKey } from './format.js'
  import type { TableRow } from './table-data.svelte.js'

  const INTERACTIVE =
    'button, a, input, textarea, select, [role="combobox"], [contenteditable]'

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
    active = false,
    expandable = false,
    expanded = false,
    ontoggle,
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
    /** Opens the row in the drawer. */
    onopen?: (row: TableRow) => void
    /** Its drawer is open. */
    active?: boolean
    /** The entity has to-many relations: the row can show them below. */
    expandable?: boolean
    expanded?: boolean
    ontoggle?: (row: TableRow) => void
  } = $props()

  let armed = $state(false)
  let deleting = $state(false)
  let disarm: ReturnType<typeof setTimeout> | undefined

  const isNew = $derived(!!row.isNew)
  const dirty = $derived(isNew || row.draft.dirty)
  const canEdit = $derived(editable && (isNew || canUpdate))
  const invalid = $derived(!!errors && Object.keys(errors).length > 0)
  const openable = $derived(!!onopen && !isNew)
  // drawer mode: the whole row is the way in
  const clickable = $derived(openable && !editable)

  function onclick(e: MouseEvent) {
    if (!clickable) return
    // a control in the row, or a text selection, keeps the click
    if (
      (e.target as HTMLElement).closest(INTERACTIVE) ||
      getSelection()?.toString()
    )
      return
    onopen?.(row)
  }

  function onkeydown(e: KeyboardEvent) {
    // only the row itself: Space and Enter inside an editor are the editor's
    if (
      !openable ||
      e.target !== e.currentTarget ||
      (e.key !== 'Enter' && e.key !== ' ')
    )
      return
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
    e.preventDefault()
    onopen?.(row)
  }

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

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<tr
  class="row"
  data-row={row.id}
  data-dirty={dirty ? '' : undefined}
  data-new={isNew ? '' : undefined}
  data-readonly={isNew || canUpdate ? undefined : ''}
  data-clickable={clickable ? '' : undefined}
  data-active={active ? '' : undefined}
  data-expanded={expanded ? '' : undefined}
  aria-busy={deleting || busy || undefined}
  tabindex={openable ? 0 : undefined}
  {onclick}
  {onkeydown}
>
  {#if expandable}
    <td class="expand">
      {#if !isNew}
        <button
          class="chevron"
          type="button"
          aria-expanded={expanded}
          aria-label={expanded ? 'Hide related rows' : 'Show related rows'}
          title={expanded ? 'Hide related rows' : 'Show related rows'}
          onclick={() => ontoggle?.(row)}
        >
          <Icon name="chevron-right" size={13} stroke={2} />
        </button>
      {/if}
    </td>
  {/if}
  <td class="gutter">
    {#if openable}
      <!-- the row is the tab stop (Enter opens), not one more per row -->
      <button
        class="open"
        type="button"
        tabindex="-1"
        aria-label="Open row"
        title={editable ? 'Open row' : 'Open row (Enter)'}
        onclick={() => onopen?.(row)}
      >
        <Icon name="arrow-up-right" size={13} stroke={2} />
      </button>
    {/if}
    {#if isNew}
      <span class="mark new" title="New row, not saved yet"
        ><Icon name="plus" size={12} stroke={2} /><span class="sr-only"
          >New row</span
        ></span
      >
    {:else if dirty}
      <span
        class="mark"
        class:invalid
        title={invalid
          ? 'Not saved: check the highlighted cells'
          : 'Edited, not saved yet'}
      >
        <span class="dot"></span><span class="sr-only"
          >{invalid ? 'Not saved, has errors' : 'Edited'}</span
        >
      </span>
    {:else if resolved && !canUpdate}
      <span class="lock" title="Read only"
        ><Icon name="lock" size={12} /><span class="sr-only">Read only</span
        ></span
      >
    {/if}
  </td>
  {#each fields as f (f.key)}
    {@const k = valueKey(f)}
    <Cell
      field={f}
      bind:value={() => row.draft.values[k], (v) => (row.draft.values[k] = v)}
      caption={f.relationToOne
        ? captions[f.valFieldKey]?.get(row.draft.values[k])
        : undefined}
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
    {:else if canDelete && !isNew}
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
  .row[data-clickable] {
    cursor: pointer;
  }
  .row:focus-visible {
    outline-offset: -2px;
  }
  .row[data-expanded] > :global(td) {
    background: var(--bg-inset);
  }
  .row[data-active] > :global(td) {
    background: color-mix(in oklch, var(--accent) 7%, var(--bg));
  }
  .expand {
    width: 24px;
    min-width: 24px;
    padding: 0 0 0 6px;
  }
  .chevron {
    position: relative;
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    padding: 0;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-faint);
    cursor: pointer;
    transition-property: color, background-color;
    transition-duration: 120ms;
    transition-timing-function: var(--ease-out);
  }
  /* hit areas fill the 28px row; taller would overlap the next row's */
  .chevron::before,
  .open::before,
  .pending .btn::before,
  .delete::before {
    content: '';
    position: absolute;
    inset: -4px;
  }
  .chevron :global(svg) {
    transition: rotate 160ms var(--ease-out);
  }
  .chevron[aria-expanded='true'] {
    color: var(--text);
  }
  .chevron[aria-expanded='true'] :global(svg) {
    rotate: 90deg;
  }
  .chevron:hover {
    background: var(--bg-active);
    color: var(--text);
  }
  .gutter {
    position: relative;
    width: 28px;
    /* the open button floats: without it the column collapses on wide tables */
    min-width: 28px;
    padding: 0 0 0 10px;
  }
  /* the way into the drawer shows where the row's status sits */
  .open {
    position: absolute;
    z-index: 1;
    inset-block: 0;
    left: 4px;
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    margin-block: auto;
    padding: 0;
    border: 0;
    border-radius: var(--radius-sm);
    background: var(--bg-raised);
    box-shadow:
      0 0 0 1px var(--border),
      0 1px 2px oklch(0 0 0 / 0.06);
    color: var(--text-muted);
    cursor: pointer;
    opacity: 0;
    scale: 0.9;
    transition-property: opacity, scale, color;
    transition-duration: 120ms;
    transition-timing-function: var(--ease-out);
  }
  .open:hover {
    color: var(--accent);
  }
  .open:active {
    scale: 0.96;
  }
  .row:is(:hover, :focus-visible, [data-active]) .open,
  .open:focus-visible {
    opacity: 1;
    scale: 1;
  }
  .row:is(:hover, :focus-visible, [data-active]) .gutter > :not(.open),
  .gutter:has(.open:focus-visible) > :not(.open) {
    opacity: 0;
  }
  @media (hover: none) {
    .open {
      opacity: 1;
      scale: 1;
    }
    .gutter > :not(.open) {
      display: none;
    }
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
    position: relative;
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
  .pending .btn::before {
    inset: -3px 0;
  }
  .delete::before {
    inset: -2px;
  }
  .delete {
    position: relative;
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
