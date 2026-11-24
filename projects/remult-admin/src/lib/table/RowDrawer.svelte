<script lang="ts" module>
  const REGEX_SEPARATORS = /[\s_-]/g

  // the key is worth showing only when the caption doesn't already spell it
  const spells = (caption: string, key: string) =>
    caption.replace(REGEX_SEPARATORS, '').toLowerCase() ===
    key.replace(REGEX_SEPARATORS, '').toLowerCase()
</script>

<script lang="ts">
  import {
    AlertDialog,
    AlertDialogBackdrop,
    AlertDialogClose,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
    createConfirm,
  } from '@ui-sdk/svelte/alert-dialog'
  import type { DialogContentState } from '@ui-sdk/svelte/dialog'
  import {
    Drawer,
    DrawerBackdrop,
    DrawerContent,
    DrawerDescription,
    DrawerTitle,
  } from '@ui-sdk/svelte/drawer'
  import type { TableInfo } from '../core/god.svelte.js'
  import { settings } from '../core/settings.svelte.js'
  import FieldEditor from '../fields/FieldEditor.svelte'
  import Icon from '../shell/Icon.svelte'
  import { modKey } from '../shell/shell.svelte.js'
  import { toast } from '../shell/Toasts.svelte'
  import { valueKey } from './format.js'
  import {
    errorMessage,
    type TableData,
    type TableRow,
  } from './table-data.svelte.js'

  let { table, data }: { table: TableInfo; data: TableData } = $props()

  type Question = { kind: 'discard' | 'delete' }
  const confirm = createConfirm<Question>()

  let open = $state(false)
  // kept through the closing slide, cleared once it is out of sight
  let held: TableRow | undefined = $state.raw()
  /** JSON fields whose text does not parse: the draft still has their last valid value. */
  let parseErrors: Record<string, string | undefined> = $state({})
  let deleting = $state(false)
  let copied = $state(false)
  let copiedTimer: ReturnType<typeof setTimeout> | undefined
  let body: HTMLDivElement | undefined = $state()
  let closeButton: HTMLButtonElement | undefined = $state()

  /** The row whose drawer is open, for the table to mark it. */
  export const openId = () => (open ? held?.id : undefined)

  export function edit(row: TableRow) {
    show(row)
  }

  export function create(prefill: Record<string, unknown> = {}) {
    show(data.draftNew(prefill))
  }

  function show(row: TableRow) {
    held = row
    parseErrors = {}
    copied = false
    open = true
  }

  const label = (x: { caption: string; key: string }) =>
    settings.displayCaption ? x.caption : x.key

  // a live update hands the table a new row object with the same draft: follow it for the fresh item
  const row = $derived(
    held && !held.isNew ? (data.find(held.id) ?? held) : held,
  )
  const isNew = $derived(!!row?.isNew)
  const id = $derived(
    row && !isNew
      ? String(table.repo.metadata.idMetadata.getId(row.item))
      : undefined,
  )
  const canEdit = $derived(!!row && (isNew || data.can('update', row.id)))
  const canDelete = $derived(!!row && !isNew && data.can('delete', row.id))
  const pending = $derived(!!row && !isNew && !data.resolved(row.id))
  const busy = $derived(!!row && !!data.saving[row.id])
  const errors = $derived(row ? data.errors[row.id] : undefined)
  const unparsed = $derived(Object.values(parseErrors).some(Boolean))
  const unsaved = $derived(!!row && (row.draft.dirty || unparsed))
  const canSave = $derived(
    canEdit && !busy && !unparsed && (isNew || !!row?.draft.dirty),
  )
  // allowApiUpdate gates API inserts too, so a readOnly field can't be set on create either
  const fields = $derived(
    isNew ? table.fields.filter((f) => !f.readOnly) : table.fields,
  )

  async function save() {
    if (!row || !canSave) return
    const r = row
    const result = await data.save(r)
    if (result.ok) {
      toast.success(r.isNew ? 'Row added' : 'Row saved')
      open = false
    } else if (result.message) toast.error(`Save failed: ${result.message}`)
    else body?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }

  function discard() {
    if (row) data.cancel(row)
    parseErrors = {}
    open = false
  }

  async function requestClose() {
    if (!unsaved) {
      open = false
      return
    }
    if (await confirm({ kind: 'discard' })) discard()
  }

  async function remove() {
    if (!row || !canDelete || deleting) return
    if (settings.confirmDelete && !(await confirm({ kind: 'delete' }))) return
    deleting = true
    try {
      await data.delete(row)
      toast.success('Row deleted')
      open = false
    } catch (err) {
      toast.error(`Delete failed: ${errorMessage(err)}`)
    } finally {
      deleting = false
    }
  }

  async function copyId() {
    if (!id) return
    try {
      await navigator.clipboard.writeText(id)
      copied = true
      clearTimeout(copiedTimer)
      copiedTimer = setTimeout(() => (copied = false), 1400)
    } catch {
      toast.error('Could not copy the id')
    }
  }

  function onkeydown(e: KeyboardEvent) {
    // a dialog inside (long text, JSON) already used these keys
    if (e.defaultPrevented) return
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      save()
    }
  }

  function focusFirst() {
    return (
      body?.querySelector<HTMLElement>('[data-cell-focus], .cm-content') ??
      closeButton ??
      null
    )
  }
</script>

<Drawer
  bind:open
  side="right"
  dismissible={!unsaved}
  onDismissAttempt={requestClose}
  onOpenChangeComplete={(o) => {
    if (!o) held = undefined
  }}
>
  <DrawerBackdrop class="drawer-scrim" />
  <DrawerContent
    class="row-drawer"
    style={`--hue: ${table.color}`}
    initialFocus={focusFirst}
    {onkeydown}
  >
    {#if row}
      <header class="head">
        <span class="mark" aria-hidden="true"></span>
        <div class="titles">
          <DrawerTitle class="title">
            {isNew ? `New ${label(table)}` : label(table)}
          </DrawerTitle>
          <DrawerDescription class="sub">
            {#if isNew}
              Fill in the fields, then create the row.
            {:else if id !== undefined}
              <button
                class="id"
                type="button"
                title="Copy id"
                aria-label={`Copy id ${id}`}
                data-copied={copied ? '' : undefined}
                onclick={copyId}
              >
                <code>{id}</code>
                <span class="id-icon" aria-hidden="true">
                  <span class="copy"><Icon name="copy" size={12} /></span>
                  <span class="done"
                    ><Icon name="check" size={12} stroke={2} /></span
                  >
                </span>
              </button>
              {#if pending}
                <span class="tag">Checking access</span>
              {:else if !canEdit}
                <span class="tag"><Icon name="lock" size={11} /> Read only</span
                >
              {:else if unsaved}
                <span class="tag edited"><span class="dot"></span> Edited</span>
              {/if}
            {/if}
          </DrawerDescription>
        </div>
        <button
          bind:this={closeButton}
          class="btn"
          data-variant="ghost"
          data-icon
          type="button"
          aria-label="Close"
          title="Close (Esc)"
          onclick={requestClose}
        >
          <Icon name="x" />
        </button>
      </header>

      <div class="body" bind:this={body}>
        {#each fields as f (f.key)}
          {@const k = valueKey(f)}
          {@const error = errors?.[k] ?? parseErrors[k]}
          {@const ctl = `drawer-${table.superKey}-${k}`}
          {@const dirty = !isNew && row.draft.isDirty(k)}
          <div
            class="field"
            data-dirty={dirty ? '' : undefined}
            data-invalid={error ? '' : undefined}
          >
            <div class="label-row">
              <label class="label" for={ctl}>
                {#if table.ids[f.key]}<span class="key" title="Id"
                    ><Icon name="key" size={11} /></span
                  >{/if}
                {label(f)}
              </label>
              {#if dirty}<span class="edited-dot" title="Edited"
                  ><span class="sr-only">Edited</span></span
                >{/if}
              {#if settings.displayCaption && !spells(f.caption, f.key)}<code
                  class="field-key">{f.key}</code
                >{/if}
            </div>
            <FieldEditor
              field={f}
              bind:value={
                () => row.draft.values[k], (v) => (row.draft.values[k] = v)
              }
              readonly={!canEdit}
              variant="form"
              caption={f.relationToOne
                ? data.captions[f.valFieldKey]?.get(row.draft.values[k])
                : undefined}
              {busy}
              invalid={!!error}
              describedby={error ? `${ctl}-error` : undefined}
              id={ctl}
              onedit={() => data.clearError(row, k)}
              onerror={(m) => (parseErrors[k] = m)}
            />
            {#if error}
              <p class="error" id={`${ctl}-error`}>
                <Icon name="alert" size={12} />{error}
              </p>
            {/if}
          </div>
        {/each}
      </div>

      <footer class="foot">
        {#if canDelete}
          <button
            class="btn delete"
            data-variant="danger"
            type="button"
            aria-label="Delete row"
            disabled={deleting || busy}
            onclick={remove}
          >
            <Icon name="trash" size={14} />Delete
          </button>
        {/if}
        <span class="spacer"></span>
        {#if canEdit}
          <span class="hint" aria-hidden="true"
            ><kbd>{modKey}</kbd><kbd>Enter</kbd></span
          >
          <!-- Cancel is an explicit discard: no confirm, unlike Esc or the close button -->
          <button
            class="btn"
            type="button"
            disabled={busy}
            onclick={unsaved ? discard : requestClose}>Cancel</button
          >
          <button
            class="btn"
            data-variant="primary"
            type="button"
            disabled={!canSave}
            aria-busy={busy || undefined}
            onclick={save}
          >
            {#if busy}Saving...{:else}<Icon
                name="check"
                size={14}
                stroke={2}
              />{isNew ? 'Create' : 'Save'}{/if}
          </button>
        {:else}
          <button class="btn" type="button" onclick={requestClose}>Close</button
          >
        {/if}
      </footer>

      <AlertDialog controller={confirm.controller}>
        <AlertDialogBackdrop class="drawer-scrim confirm-scrim" />
        <AlertDialogContent class="confirm">
          {#snippet children(state: DialogContentState<Question>)}
            {@const del = state.payload?.kind === 'delete'}
            <AlertDialogTitle class="confirm-title"
              >{del
                ? 'Delete this row?'
                : 'Discard your changes?'}</AlertDialogTitle
            >
            <AlertDialogDescription class="confirm-desc">
              {del
                ? `It is removed from ${label(table)} for everyone. This can't be undone.`
                : 'The edits in this row are not saved. Closing drops them.'}
            </AlertDialogDescription>
            <div class="confirm-actions">
              <AlertDialogClose class="btn"
                >{del ? 'Cancel' : 'Keep editing'}</AlertDialogClose
              >
              <AlertDialogClose
                class="btn"
                data-variant={del ? 'danger-solid' : 'primary'}
                value="confirm"
              >
                {del ? 'Delete' : 'Discard'}
              </AlertDialogClose>
            </div>
          {/snippet}
        </AlertDialogContent>
      </AlertDialog>
    {/if}
  </DrawerContent>
</Drawer>

<style>
  :global(.drawer-scrim) {
    position: fixed;
    inset: 0;
    background: var(--scrim);
  }
  :global(.row-drawer) {
    display: flex;
    flex-direction: column;
    width: min(500px, calc(100vw - 16px));
    height: calc(100dvh - 16px);
    margin: 8px;
    border-radius: 12px;
    background: var(--bg-raised);
    color: var(--text);
    box-shadow:
      0 0 0 1px var(--border),
      var(--shadow-pop);
    font-family: var(--font);
    font-size: var(--text-md);
    white-space: normal;
    text-align: start;
    overflow: hidden;
    /* a parent sheet steps back while a dialog opens above it */
    scale: calc(1 - var(--drawer-stack, 0) * 0.02);
    transform-origin: 100% 50%;
  }
  :global(.row-drawer:focus-visible) {
    outline: none;
  }

  .head {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 18px 12px 14px 20px;
    border-bottom: 1px solid var(--border);
  }
  /* the entity's hue, ringed so it holds on both themes */
  .mark {
    flex: none;
    width: 10px;
    height: 10px;
    margin-top: 6px;
    border-radius: 50%;
    background: oklch(var(--hue-l) var(--hue-c) var(--hue, 262));
    box-shadow: 0 0 0 4px
      oklch(var(--hue-l) var(--hue-c) var(--hue, 262) / 0.16);
  }
  .titles {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    min-width: 0;
  }
  :global(.row-drawer .title) {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 22px;
  }
  :global(.row-drawer .sub) {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0;
    color: var(--text-muted);
    font-size: var(--text-sm);
  }
  .id {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    height: 22px;
    padding: 0 6px 0 7px;
    border: 0;
    border-radius: var(--radius-sm);
    background: var(--bg-inset);
    box-shadow: inset 0 0 0 1px var(--border);
    color: var(--text-muted);
    cursor: pointer;
    transition-property: color, background-color, scale;
    transition-duration: 120ms;
    transition-timing-function: var(--ease-out);
  }
  .id:hover {
    color: var(--text);
    background: var(--bg-hover);
  }
  .id:active {
    scale: 0.96;
  }
  .id code {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--mono);
    font-size: var(--text-sm);
  }
  .id-icon {
    position: relative;
    display: grid;
    width: 12px;
    height: 12px;
  }
  .id-icon > span {
    position: absolute;
    inset: 0;
    display: grid;
    transition-property: opacity, scale, filter;
    transition-duration: 200ms;
    transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
  }
  .done {
    color: var(--success);
    opacity: 0;
    scale: 0.25;
    filter: blur(4px);
  }
  [data-copied] .copy {
    opacity: 0;
    scale: 0.25;
    filter: blur(4px);
  }
  [data-copied] .done {
    opacity: 1;
    scale: 1;
    filter: blur(0);
  }
  .tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--text-faint);
    font-size: var(--text-xs);
  }
  .tag.edited {
    color: var(--accent);
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
    min-height: 0;
    padding: 18px 20px 24px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .label-row {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 16px;
  }
  .label {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--text-muted);
    font-size: var(--text-sm);
    font-weight: 550;
  }
  .key {
    display: flex;
    color: var(--warning);
  }
  .edited-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
  }
  .field-key {
    margin-inline-start: auto;
    color: var(--text-faint);
    font-family: var(--mono);
    font-size: var(--text-xs);
  }
  .field[data-dirty] .label {
    color: var(--text);
  }
  .field[data-invalid] .label {
    color: var(--danger);
  }
  .error {
    display: flex;
    align-items: center;
    gap: 5px;
    margin: 0;
    color: var(--danger);
    font-size: var(--text-sm);
  }
  /* form controls breathe more than cells */
  .field :global(.ctl) {
    height: 32px;
  }

  .foot {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px 12px 20px;
    border-top: 1px solid var(--border);
    background: var(--bg-inset);
  }
  .spacer {
    flex: 1;
  }
  .delete {
    margin-inline-start: -10px;
    border-color: transparent;
    background: transparent;
  }
  .hint {
    display: inline-flex;
    gap: 3px;
    margin-inline-end: 4px;
  }
  .foot .btn[data-variant='primary'] {
    min-width: 76px;
  }
  @media (hover: none) {
    .hint {
      display: none;
    }
  }

  :global(.confirm) {
    position: fixed;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    width: min(380px, calc(100vw - 32px));
    margin: 0;
    padding: 20px;
    border-radius: 12px;
    background: var(--bg-raised);
    color: var(--text);
    box-shadow:
      0 0 0 1px var(--border),
      var(--shadow-pop);
    font-family: var(--font);
    font-size: var(--text-md);
    transition:
      opacity 150ms var(--ease-out),
      scale 150ms var(--ease-out);
  }
  :global(.confirm:is([data-starting-style], [data-ending-style])) {
    opacity: 0;
    scale: 0.97;
  }
  :global(.confirm-scrim) {
    transition: opacity 150ms var(--ease-out);
  }
  :global(.confirm-scrim:is([data-starting-style], [data-ending-style])) {
    opacity: 0;
  }
  :global(.confirm .confirm-title) {
    margin: 0 0 6px;
    font-size: var(--text-lg);
    font-weight: 600;
  }
  :global(.confirm .confirm-desc) {
    margin: 0 0 20px;
    color: var(--text-muted);
    text-wrap: pretty;
  }
  .confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  :global(.confirm .btn[data-variant='danger-solid']) {
    border-color: transparent;
    background: var(--danger);
    color: var(--accent-text);
  }
  :global(.confirm .btn[data-variant='danger-solid']:hover) {
    background: color-mix(in oklch, var(--danger), var(--text) 12%);
  }
</style>
