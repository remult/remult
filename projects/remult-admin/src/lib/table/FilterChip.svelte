<script lang="ts">
  import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@ui-sdk/svelte/popover'
  import type { FieldUIInfo } from '../../../../core/server/remult-admin'
  import { choiceOf, valueText } from '../query/filter-labels.js'
  import type { FilterChip } from '../query/filter-model.js'
  import Icon from '../shell/Icon.svelte'
  import FilterEditor from './FilterEditor.svelte'

  let {
    field,
    chip,
    label,
    captionOf,
    onapply,
    onremove,
  }: {
    field: FieldUIInfo
    chip: FilterChip
    label: string
    captionOf: (id: unknown) => unknown
    onapply: (chip: FilterChip) => void
    onremove: () => void
  } = $props()

  let open = $state(false)
  const op = $derived(choiceOf(field, chip)?.label ?? chip.op)
  const text = $derived(valueText(field, chip, captionOf))
  const summary = $derived([label, op, text].filter(Boolean).join(' '))
</script>

<span class="chip" data-open={open ? '' : undefined}>
  <Popover bind:open>
    <PopoverTrigger class="chip-main" title={summary} aria-label={`Filter: ${summary}. Edit`}>
      <span class="name">{label}</span>
      <span class="op">{op}</span>
      {#if text !== undefined}<span class="value">{text}</span>{/if}
    </PopoverTrigger>
    <PopoverContent class="filter-pop" align="start" sideOffset={6} collisionPadding={12} initialFocus="[data-autofocus]">
      <PopoverTitle class="sr-only">Edit filter on {label}</PopoverTitle>
      <FilterEditor
        {field}
        {chip}
        {label}
        {captionOf}
        onapply={(c) => {
          open = false
          onapply(c)
        }}
        onremove={() => {
          open = false
          onremove()
        }}
      />
    </PopoverContent>
  </Popover>
  <button class="chip-x" type="button" aria-label={`Remove filter: ${summary}`} title="Remove filter" onclick={onremove}>
    <Icon name="x" size={12} stroke={2} />
  </button>
</span>

<style>
  .chip {
    display: inline-flex;
    align-items: stretch;
    height: 24px;
    max-width: 100%;
    border-radius: var(--radius);
    background: var(--accent-soft);
    box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--accent) 22%, transparent);
    font-size: var(--text-sm);
    animation: chip-in 160ms var(--ease-out);
  }
  @keyframes chip-in {
    from {
      opacity: 0;
      scale: 0.96;
    }
  }
  .chip :global(.chip-main) {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    padding: 0 4px 0 9px;
    border: 0;
    border-radius: var(--radius) 0 0 var(--radius);
    background: transparent;
    color: var(--text);
    cursor: pointer;
    white-space: nowrap;
    transition: background-color 100ms var(--ease-out);
  }
  .chip :global(.chip-main:hover),
  .chip[data-open] :global(.chip-main) {
    background: color-mix(in oklch, var(--accent) 10%, transparent);
  }
  .chip :global(.chip-main:focus-visible) {
    outline-offset: -2px;
  }
  .name {
    color: var(--text-muted);
  }
  .op {
    color: var(--text-faint);
  }
  .value {
    min-width: 0;
    max-width: 280px;
    overflow: hidden;
    font-weight: 600;
    text-overflow: ellipsis;
  }
  .chip-x {
    position: relative;
    display: grid;
    place-items: center;
    width: 22px;
    padding: 0;
    border: 0;
    border-radius: 0 var(--radius) var(--radius) 0;
    background: transparent;
    color: var(--text-faint);
    cursor: pointer;
    transition:
      background-color 100ms var(--ease-out),
      color 100ms var(--ease-out);
  }
  .chip-x:hover {
    background: color-mix(in oklch, var(--accent) 10%, transparent);
    color: var(--text);
  }
  .chip-x:focus-visible {
    outline-offset: -2px;
  }
  :global(.filter-pop) {
    z-index: 30;
    margin: 0;
    border: 0;
    width: 320px;
    max-width: calc(100vw - 24px);
    padding: 12px;
    border-radius: var(--radius-lg);
    background: var(--bg-raised);
    color: var(--text);
    box-shadow:
      0 0 0 1px var(--border),
      var(--shadow-pop);
    transform-origin: var(--transform-origin);
    transition:
      opacity 140ms var(--ease-out),
      scale 140ms var(--ease-out),
      translate 140ms var(--ease-out);
  }
  :global(.filter-pop:is([data-starting-style], [data-ending-style])) {
    opacity: 0;
    scale: 0.98;
    translate: 0 -2px;
  }
</style>
