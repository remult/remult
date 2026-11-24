<script lang="ts">
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectItemIndicator,
    SelectTrigger,
    SelectValue,
  } from '@ui-sdk/svelte/select'
  import type { FieldUIInfo } from '../../../../core/server/remult-admin'
  import Icon from '../shell/Icon.svelte'

  type Id = string | number

  let {
    field,
    value,
    label,
    busy,
    invalid,
    describedby,
    id,
    set,
  }: {
    field: FieldUIInfo
    value: unknown
    label: string
    busy: boolean
    invalid: boolean
    describedby?: string
    id?: string
    set: (v: unknown) => void
  } = $props()

  const items = $derived(field.values.map((v) => ({ value: v.id, label: v.caption })))
  // the item's own id is written back, so a number stays a number
  const selected = $derived((field.values.find((v) => v.id === value)?.id ?? null) as Id | null)
  const placeholder = $derived(
    value === null ? 'null' : value === undefined || value === '' ? '' : String(value),
  )
</script>

<Select
  {items}
  value={selected}
  {placeholder}
  readOnly={busy}
  itemToValue={(v: Id) => String(v)}
  onValueChange={(v: Id | null) => {
    // only a user pick lands here: mounting with no value writes nothing
    if (v !== null) set(v)
  }}
>
  <SelectTrigger
    {id}
    class="ctl select"
    aria-label={id ? undefined : label}
    aria-invalid={invalid || undefined}
    aria-describedby={describedby}
    data-cell-focus
  >
    <SelectValue class="select-value" />
    <Icon name="chevron-down" size={12} />
  </SelectTrigger>
  <SelectContent class="select-popup">
    {#each items as item (item.value)}
      <SelectItem value={item.value} class="select-item">
        <span class="select-label">{item.label}</span>
        <SelectItemIndicator class="select-check">
          <Icon name="check" size={14} stroke={2} />
        </SelectItemIndicator>
      </SelectItem>
    {/each}
  </SelectContent>
</Select>

<style>
  :global(.select) {
    display: flex;
    align-items: center;
    gap: 6px;
    text-align: start;
    cursor: pointer;
  }
  :global(.select > svg) {
    color: var(--text-faint);
    transition: color 120ms var(--ease-out);
  }
  :global(.select:hover > svg) {
    color: var(--text-muted);
  }
  :global(.select-value) {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  :global(.select-value[data-placeholder]) {
    color: var(--text-faint);
    font-family: var(--mono);
    font-size: var(--text-xs);
  }
  :global(.select-popup) {
    z-index: 40;
    min-width: max(var(--anchor-width), 160px);
    max-height: min(320px, var(--available-height));
    overflow-y: auto;
    margin: 0;
    padding: 4px;
    border: 0;
    outline: none;
    border-radius: var(--radius-lg);
    background: var(--bg-raised);
    color: var(--text);
    box-shadow:
      0 0 0 1px var(--border),
      var(--shadow-pop);
    font-size: var(--text-md);
    white-space: nowrap;
    text-align: start;
    transform-origin: var(--transform-origin);
    transition:
      opacity 120ms var(--ease-out),
      scale 120ms var(--ease-out);
  }
  :global(.select-popup:is([data-starting-style], [data-ending-style])) {
    opacity: 0;
    scale: 0.97;
  }
  :global(.select-item) {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 28px;
    padding: 0 8px 0 10px;
    border-radius: 6px;
    cursor: pointer;
    outline: none;
  }
  :global(.select-item[data-highlighted]) {
    background: var(--bg-hover);
  }
  :global(.select-item[data-selected]) {
    font-weight: 550;
  }
  :global(.select-label) {
    flex: 1;
  }
  :global(.select-check) {
    display: flex;
    color: var(--accent);
  }
</style>
