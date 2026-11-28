<script lang="ts" module>
  /** Ms to let the table's batch answer before looking one caption up. */
  const CAPTION_LOOKUP_DELAY_MS = 400
</script>

<script lang="ts">
  import type { FieldUIInfo } from '../../../../core/server/remult-admin'
  import { settings } from '../core/settings.svelte.js'
  import { filled } from '../core/relation-captions.js'
  import { captions } from '../relations/caption-cache.svelte.js'
  import Icon from '../shell/Icon.svelte'
  import Display from './Display.svelte'
  import EnumField from './EnumField.svelte'
  import { fromLocalInput, kindOf, toLocalInput } from './field-kind.js'
  import JsonField from './JsonField.svelte'
  import RelationField from './RelationField.svelte'
  import TextField from './TextField.svelte'

  let {
    field,
    value = $bindable(),
    readonly = false,
    variant = 'cell',
    caption,
    busy = false,
    invalid = false,
    describedby,
    id,
    onedit,
    onerror,
  }: {
    field: FieldUIInfo
    /** Never written until the user edits: mounting an editor must not dirty a row. */
    value: unknown
    readonly?: boolean
    variant?: 'cell' | 'form'
    /** Relation caption for the current value. */
    caption?: unknown
    /** Saving: keep focus, refuse edits. */
    busy?: boolean
    invalid?: boolean
    describedby?: string
    /** Set when an outside label names the control (form). */
    id?: string
    onedit?: () => void
    /** Form JSON: the text does not parse (undefined once it does). */
    onerror?: (message: string | undefined) => void
  } = $props()

  const kind = $derived(kindOf(field))
  const ro = $derived(readonly || field.readOnly)
  const label = $derived(settings.displayCaption ? field.caption : field.key)
  const clearable = $derived(
    !ro &&
      field.allowNull &&
      kind !== 'relation' &&
      value !== null &&
      value !== undefined,
  )

  const empty = $derived(value === undefined || value === null || value === '')

  // the page's batch caption first; a value it doesn't cover (just picked, or a missed batch) is looked up
  const relationCaption = $derived(
    kind !== 'relation' || filled(caption) || empty
      ? caption
      : captions.get(field, value),
  )
  $effect(() => {
    if (kind !== 'relation' || empty || filled(relationCaption)) return
    const v = value
    // the table's batch usually answers first: only ask for what it leaves out
    const t = setTimeout(
      () => captions.request(field, v),
      CAPTION_LOOKUP_DELAY_MS,
    )
    return () => clearTimeout(t)
  })

  function set(v: unknown) {
    if (busy) return
    value = v
    onedit?.()
  }

  const a11y = $derived({
    id,
    'aria-label': id ? undefined : label,
    'aria-invalid': invalid || undefined,
    'aria-describedby': describedby,
  })
  const sub = $derived({ value, label, busy, invalid, describedby, id, set })
</script>

<div
  class="editor"
  data-variant={variant}
  data-kind={kind}
  data-readonly={ro ? '' : undefined}
>
  {#if ro}
    <div class="ro" {id}>
      <Display {field} {value} caption={relationCaption} />
    </div>
  {:else if kind === 'relation'}
    <RelationField {field} caption={relationCaption} {...sub} />
  {:else if kind === 'json'}
    <JsonField {...sub} inline={variant === 'form'} {onerror} />
  {:else if kind === 'enum'}
    <EnumField {field} {...sub} />
  {:else if kind === 'boolean'}
    <span class="switch-wrap">
      <input
        {...a11y}
        class="switch"
        type="checkbox"
        role="switch"
        data-cell-focus
        checked={value === true}
        bind:indeterminate={
          () => value === null || value === undefined, () => {}
        }
        onchange={(e) => {
          if (busy) e.currentTarget.checked = value === true
          else set(e.currentTarget.checked)
        }}
      />
    </span>
  {:else if kind === 'number'}
    <input
      {...a11y}
      class="ctl num"
      type="number"
      step="any"
      readonly={busy}
      placeholder={value === null ? 'null' : ''}
      data-cell-focus
      bind:value={() => (value ?? null) as number | null, (v) => set(v ?? null)}
    />
  {:else if kind === 'date' || kind === 'datetime'}
    <input
      {...a11y}
      class="ctl"
      type={kind === 'date' ? 'date' : 'datetime-local'}
      readonly={busy}
      data-empty={empty ? '' : undefined}
      data-cell-focus
      value={kind === 'date' ? String(value ?? '') : toLocalInput(value)}
      oninput={(e) => {
        const el = e.currentTarget
        // a half typed value reads as '': keep the stored one until it is complete
        if (el.validity.badInput) return
        if (kind === 'date') set(el.value || null)
        // same minute as shown: keep the stored instant (and its seconds)
        else if (el.value !== toLocalInput(value)) set(fromLocalInput(el.value))
      }}
    />
  {:else if kind === 'color'}
    <span class="color">
      <input
        {...a11y}
        class="swatch"
        type="color"
        data-cell-focus
        disabled={busy}
        value={typeof value === 'string' && value ? value : '#000000'}
        oninput={(e) => set(e.currentTarget.value)}
      />
      <span class="hex" class:null={value === null}
        >{value ?? ''}{value === null ? 'null' : ''}</span
      >
    </span>
  {:else}
    <TextField {...sub} />
  {/if}
  {#if clearable}
    <button
      class="clear"
      type="button"
      tabindex="-1"
      aria-label={`Set ${label} to null`}
      title="Set to null"
      onclick={() => set(null)}
    >
      <Icon name="x" size={12} />
    </button>
  {/if}
</div>

<style>
  .editor {
    position: relative;
    display: flex;
    align-items: center;
    gap: 2px;
    min-width: 0;
    width: 100%;
  }
  .editor > :global(*:first-child) {
    flex: 1;
    min-width: 0;
  }

  /* one control look for inputs, select triggers and picker buttons */
  .editor :global(.ctl) {
    width: 100%;
    min-width: 0;
    height: 28px;
    margin: 0;
    padding: 0 8px;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    background: var(--bg-raised);
    color: var(--text);
    font-size: var(--text-md);
    transition:
      border-color 120ms var(--ease-out),
      background-color 120ms var(--ease-out),
      box-shadow 120ms var(--ease-out);
  }
  .editor :global(.ctl:hover) {
    border-color: color-mix(in oklch, var(--border-strong), var(--text) 15%);
  }
  .editor :global(.ctl:focus-visible),
  .editor :global(.ctl[data-open]) {
    outline: 2px solid var(--ring);
    outline-offset: -1px;
    border-color: var(--accent);
  }
  .editor :global(.ctl[aria-invalid='true']) {
    border-color: var(--danger);
  }
  .editor :global(.ctl::placeholder) {
    color: var(--text-faint);
    font-family: var(--mono);
    font-size: var(--text-xs);
  }
  .editor :global(.ctl[readonly]) {
    cursor: progress;
  }
  .num {
    text-align: end;
  }
  /* a form reads top to bottom: numbers line up with the other fields */
  [data-variant='form'] .num {
    text-align: start;
  }
  .num::-webkit-inner-spin-button {
    display: none;
  }

  /* in a cell the control is the cell: no box until hover or focus */
  [data-variant='cell'] :global(.ctl) {
    height: calc(var(--row-h) - 2px);
    padding: 0 11px;
    border-color: transparent;
    border-radius: var(--radius-sm);
    background: transparent;
  }
  [data-variant='cell'] :global(.ctl:hover) {
    border-color: var(--border);
    background: var(--bg-raised);
  }
  [data-variant='cell'] :global(.ctl:focus-visible),
  [data-variant='cell'] :global(.ctl[data-open]) {
    background: var(--bg-raised);
  }
  [data-variant='cell'] :global(.ctl[aria-invalid='true']) {
    border-color: transparent;
    background: transparent;
  }
  .editor :global(.ctl[aria-invalid='true']:focus-visible) {
    outline-color: color-mix(in oklch, var(--danger) 60%, transparent);
    border-color: var(--danger);
  }
  /* cells stay quiet: affordance icons show on the hovered or focused cell only */
  [data-variant='cell'] :global(.ctl > svg),
  [data-variant='cell'] :global(.ctl::-webkit-calendar-picker-indicator) {
    opacity: 0;
    transition: opacity 120ms var(--ease-out);
  }
  [data-variant='cell']:hover :global(.ctl > svg),
  [data-variant='cell'] :global(.ctl:is(:focus-visible, [data-open]) > svg),
  [data-variant='cell']:hover :global(.ctl::-webkit-calendar-picker-indicator),
  [data-variant='cell'] :global(.ctl:focus::-webkit-calendar-picker-indicator) {
    opacity: 0.7;
  }
  /* an empty date shows no mm/dd/yyyy mask until it is edited */
  [data-variant='cell'] :global(.ctl[data-empty]:not(:focus)) {
    color: transparent;
  }
  [data-variant='cell'] .ro {
    padding: 0 12px;
  }
  [data-variant='cell'][data-kind='number'] .ro {
    text-align: end;
  }

  .ro {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  [data-variant='form'] .ro {
    display: flex;
    align-items: center;
    min-height: 28px;
    padding: 0 8px;
    border-radius: var(--radius);
    background: var(--bg-inset);
    color: var(--text-muted);
  }

  .switch-wrap {
    display: flex;
    align-items: center;
    height: 28px;
    padding: 0 11px;
  }
  [data-variant='form'] .switch-wrap {
    padding: 0;
  }
  .switch {
    appearance: none;
    position: relative;
    flex: none;
    width: 30px;
    height: 18px;
    margin: 0;
    border-radius: 9px;
    background: var(--border-strong);
    cursor: pointer;
    transition: background-color 150ms var(--ease-out);
  }
  .switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: oklch(1 0 0);
    box-shadow: 0 1px 2px oklch(0 0 0 / 0.2);
    transition: translate 150ms var(--ease-out);
  }
  .switch:checked {
    background: var(--accent);
  }
  .switch:checked::after {
    translate: 12px 0;
  }
  /* no value yet: thumb in the middle, neither on nor off */
  .switch:indeterminate {
    background: var(--bg-active);
    box-shadow: inset 0 0 0 1px var(--border-strong);
  }
  .switch:indeterminate::after {
    translate: 6px 0;
    opacity: 0.7;
  }

  .color {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 28px;
    padding: 0 11px;
  }
  [data-variant='form'] .color {
    padding: 0;
  }
  .swatch {
    flex: none;
    width: 18px;
    height: 18px;
    padding: 0;
    border: 0;
    border-radius: var(--radius-sm);
    background: none;
    box-shadow: inset 0 0 0 1px oklch(0 0 0 / 0.1);
    cursor: pointer;
  }
  .swatch::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  .swatch::-webkit-color-swatch {
    border: 0;
    border-radius: var(--radius-sm);
  }
  .hex {
    font-family: var(--mono);
    font-size: var(--text-sm);
  }
  .hex.null {
    color: var(--text-faint);
    font-size: var(--text-xs);
  }

  .clear {
    position: relative;
    display: grid;
    flex: none;
    place-items: center;
    width: 20px;
    height: 20px;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-faint);
    cursor: pointer;
    transition-property: opacity, color, background-color;
    transition-duration: 120ms;
    transition-timing-function: var(--ease-out);
  }
  .clear::before {
    content: '';
    position: absolute;
    inset: -4px;
  }
  .clear:hover {
    color: var(--text);
    background: var(--bg-hover);
  }
  [data-variant='cell'] .clear {
    opacity: 0;
  }
  [data-variant='cell']:is(:hover, :focus-within) .clear {
    opacity: 1;
  }
  @media (hover: none) {
    [data-variant='cell'] .clear {
      opacity: 1;
    }
  }
</style>
