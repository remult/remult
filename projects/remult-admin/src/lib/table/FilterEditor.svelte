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
  import { choiceOf, isComplete, isDate as isDateField, isNumber as isNumberField, opChoices } from '../query/filter-labels.js'
  import type { FilterChip } from '../query/filter-model.js'
  import Icon from '../shell/Icon.svelte'
  import FilterDate from './FilterDate.svelte'
  import ValueChecklist from './ValueChecklist.svelte'

  let {
    field,
    chip,
    label,
    captionOf,
    onapply,
    onremove,
  }: {
    field: FieldUIInfo
    /** The chip being edited; undefined when adding. */
    chip?: FilterChip
    label: string
    captionOf: (id: unknown) => unknown
    onapply: (chip: FilterChip) => void
    onremove?: () => void
  } = $props()

  // svelte-ignore state_referenced_locally
  const choices = opChoices(field)
  // svelte-ignore state_referenced_locally
  let choiceId = $state((chip && choiceOf(field, chip)?.id) ?? choices[0].id)
  // svelte-ignore state_referenced_locally
  let value: unknown = $state(chip?.value)
  // svelte-ignore state_referenced_locally
  let value2: unknown = $state(chip?.value2)

  const choice = $derived(choices.find((c) => c.id === choiceId) ?? choices[0])
  const isDate = $derived(isDateField(field))
  const isNumber = $derived(isNumberField(field))
  const list = $derived(Array.isArray(value) ? value : [])

  const draft: FilterChip = $derived.by(() => {
    const c: FilterChip = { field: field.key, op: choice.op }
    if (choice.fixed !== undefined) c.value = choice.fixed
    else if (choice.arity === 'list') c.value = list
    else if (choice.arity === 1) c.value = value
    else if (choice.arity === 2) {
      c.value = value
      c.value2 = value2
    }
    return c
  })
  const ready = $derived(isComplete(field, draft))

  function pick(id: string) {
    const next = choices.find((c) => c.id === id)
    if (!next) return
    // a list and a single value don't convert into each other
    if ((next.arity === 'list') !== (choice.arity === 'list')) value = next.arity === 'list' ? [] : undefined
    choiceId = id
  }

  function num(raw: string) {
    return raw.trim() === '' ? undefined : Number(raw)
  }

  function submit(e: SubmitEvent) {
    e.preventDefault()
    if (ready) onapply($state.snapshot(draft) as FilterChip)
  }
</script>

<form class="filter-editor" onsubmit={submit}>
  <div class="op-row">
    <span class="field-name" title={field.key}>{label}</span>
    <Select
      items={choices.map((c) => ({ value: c.id, label: c.label }))}
      value={choiceId}
      onValueChange={(v: string | null) => v && pick(v)}
    >
      <SelectTrigger class="op-trigger" aria-label="Operator">
        <SelectValue class="select-value" />
        <Icon name="chevron-down" size={12} />
      </SelectTrigger>
      <SelectContent class="select-popup">
        {#each choices as c (c.id)}
          <SelectItem value={c.id} class="select-item">
            <span class="select-label">{c.label}</span>
            <SelectItemIndicator class="select-check">
              <Icon name="check" size={14} stroke={2} />
            </SelectItemIndicator>
          </SelectItem>
        {/each}
      </SelectContent>
    </Select>
  </div>

  {#if choice.arity === 'list'}
    <ValueChecklist {field} value={list} {label} {captionOf} onchange={(v) => (value = v)} />
  {:else if choice.arity !== 0 && isDate}
    {#key choice.arity}
      <FilterDate
        range={choice.arity === 2}
        {value}
        {value2}
        {label}
        onchange={(a, b) => {
          value = a
          value2 = b
        }}
      />
    {/key}
  {:else if choice.arity === 2}
    <div class="pair">
      <input
        class="input"
        type="number"
        step="any"
        aria-label={`${label} from`}
        placeholder="From"
        data-autofocus
        value={value ?? ''}
        oninput={(e) => (value = num(e.currentTarget.value))}
      />
      <span class="and">and</span>
      <input
        class="input"
        type="number"
        step="any"
        aria-label={`${label} to`}
        placeholder="To"
        value={value2 ?? ''}
        oninput={(e) => (value2 = num(e.currentTarget.value))}
      />
    </div>
  {:else if choice.arity === 1}
    <input
      class="input"
      type={isNumber ? 'number' : 'text'}
      step={isNumber ? 'any' : undefined}
      aria-label={`${label} value`}
      placeholder={isNumber ? 'Number' : 'Text'}
      data-autofocus
      value={value ?? ''}
      oninput={(e) => (value = isNumber ? num(e.currentTarget.value) : e.currentTarget.value)}
    />
  {/if}

  <div class="actions">
    {#if onremove}
      <button class="btn" data-variant="ghost" type="button" onclick={onremove}>
        <Icon name="trash" size={13} /> Remove
      </button>
    {/if}
    <button class="btn apply" data-variant="primary" type="submit" disabled={!ready}>
      Apply
    </button>
  </div>
</form>

<style>
  .filter-editor {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .op-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .field-name {
    min-width: 0;
    overflow: hidden;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .op-row :global(.op-trigger) {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 4px;
    height: 24px;
    padding: 0 6px 0 8px;
    border: 0;
    border-radius: var(--radius);
    background: var(--bg-inset);
    box-shadow: inset 0 0 0 1px var(--border);
    color: var(--text-muted);
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .op-row :global(.op-trigger:hover),
  .op-row :global(.op-trigger[data-open]) {
    color: var(--text);
    background: var(--bg-hover);
  }
  .op-row :global(.op-trigger svg) {
    color: var(--text-faint);
  }
  .pair {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .and {
    color: var(--text-faint);
    font-size: var(--text-sm);
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .apply {
    margin-inline-start: auto;
  }
  input[type='number']::-webkit-inner-spin-button {
    display: none;
  }
</style>
