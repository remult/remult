<script lang="ts" module>
  // a value no target can have: the "Unset" row
  const UNSET = '\u0000unset'
</script>

<script lang="ts">
  import {
    Combobox,
    ComboboxContent,
    ComboboxInput,
    ComboboxItem,
    ComboboxItemIndicator,
    ComboboxList,
    ComboboxTrigger,
  } from '@ui-sdk/svelte/combobox'
  import { onDestroy } from 'svelte'
  import type { FieldUIInfo } from '../../../../core/server/remult-admin'
  import { captions } from '../relations/caption-cache.svelte.js'
  import { RelationSearch } from '../relations/relation-search.svelte.js'
  import Icon from '../shell/Icon.svelte'

  let {
    field,
    value,
    caption,
    label,
    busy,
    invalid,
    describedby,
    id,
    set,
  }: {
    field: FieldUIInfo
    value: unknown
    caption?: unknown
    label: string
    busy: boolean
    invalid: boolean
    describedby?: string
    id?: string
    set: (v: unknown) => void
  } = $props()

  // svelte-ignore state_referenced_locally
  const search = new RelationSearch(field)
  onDestroy(() => search.dispose())

  let query = $state('')
  let button: HTMLButtonElement | undefined = $state()

  const nullable = $derived(field.allowNull || !!field.relationToOne?.allowNull)
  const empty = $derived(value === undefined || value === null || value === '')
  const known = $derived(caption !== undefined && caption !== null && caption !== '')
  const text = $derived(empty ? (value === null ? 'null' : '') : known ? String(caption) : String(value))
  const selected = $derived(empty ? null : value)
  const more = $derived(search.count !== undefined && search.count > search.items.length)
  const key = (v: unknown) => `${typeof v}:${String(v)}`
</script>

<Combobox
  value={selected}
  bind:query
  filter={false}
  readOnly={busy}
  autoHighlight="selected"
  itemToValue={key}
  isItemEqualToValue={(a: unknown, b: unknown) => key(a) === key(b)}
  itemToLabel={(v: unknown) => String(captions.get(field, v) ?? v)}
  onOpenChange={(open: boolean) => {
    if (!open) return
    query = ''
    search.search('')
  }}
  onQueryChange={(q: string, details: { reason: string }) => {
    // choosing writes the label into the input: that's not a search
    if (details.reason === 'input-change') search.search(q)
  }}
  onValueChange={(v: unknown) => {
    if (v === UNSET) set(null)
    else if (v !== null && v !== undefined) set(v)
  }}
  onOpenChangeComplete={(open: boolean) => !open && button?.focus()}
>
  <ComboboxTrigger>
    {#snippet render({ props })}
      <button
        {...props}
        {...{ 'aria-invalid': invalid || undefined }}
        {id}
        bind:this={button}
        class="ctl relation"
        type="button"
        aria-haspopup="listbox"
        aria-label={`${label}: ${text || 'none'}`}
        aria-describedby={describedby}
        title={empty ? undefined : String(value)}
        data-cell-focus
      >
        <span class="caption" class:missing={!empty && !known} class:empty>{text}</span>
        <Icon name="chevron-down" size={12} />
      </button>
    {/snippet}
  </ComboboxTrigger>
  <ComboboxContent anchor={button} class="select-popup relation-popup" sideOffset={4} align="start">
    <div class="search">
      <Icon name="search" size={14} />
      <ComboboxInput class="search-input" aria-label={`Search ${label}`} placeholder="Search..." autofocus />
    </div>
    <ComboboxList class="relation-list" aria-busy={search.loading || undefined}>
      {#if nullable}
        <ComboboxItem value={UNSET} label="Unset" class="select-item unset">
          <Icon name="x" size={12} />
          <span class="select-label">Unset</span>
        </ComboboxItem>
      {/if}
      {#each search.items as item (key(item.id))}
        <ComboboxItem value={item.id} label={String(item.caption ?? item.id)} class="select-item">
          <span class="select-label" class:missing={item.caption === undefined}>{item.caption ?? item.id}</span>
          <ComboboxItemIndicator class="select-check">
            <Icon name="check" size={14} stroke={2} />
          </ComboboxItemIndicator>
        </ComboboxItem>
      {/each}
    </ComboboxList>
    <div class="foot" aria-live="polite">
      {#if search.error}
        <span class="error">{search.error}</span>
      {:else if search.loading && !search.items.length}
        Searching...
      {:else if !search.items.length}
        {query ? `No match for "${query}"` : 'Nothing to pick'}
      {:else if more}
        {search.items.length} of {search.count}, type to narrow
      {:else}
        {search.count} {search.count === 1 ? 'match' : 'matches'}
      {/if}
    </div>
  </ComboboxContent>
</Combobox>

<style>
  .relation {
    display: flex;
    align-items: center;
    gap: 6px;
    text-align: start;
    cursor: pointer;
  }
  .relation :global(svg) {
    color: var(--text-faint);
  }
  .caption {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
  :global(.relation-popup) {
    width: max(var(--anchor-width), 260px);
    max-width: min(360px, var(--available-width));
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 0 12px;
    border-bottom: 1px solid var(--border);
    color: var(--text-faint);
  }
  .search :global(.search-input) {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: 0;
    padding: 0;
    background: transparent;
    color: var(--text);
    outline: none;
  }
  .search :global(.search-input::placeholder) {
    color: var(--text-faint);
  }
  :global(.relation-list) {
    max-height: min(280px, calc(var(--available-height, 320px) - 72px));
    overflow-y: auto;
    padding: 4px;
  }
  :global(.relation-list[aria-busy='true']) {
    opacity: 0.7;
  }
  :global(.select-item.unset) {
    color: var(--text-muted);
  }
  .foot {
    padding: 6px 12px;
    border-top: 1px solid var(--border);
    color: var(--text-faint);
    font-size: var(--text-xs);
    white-space: normal;
  }
  .error {
    color: var(--danger);
  }
</style>
