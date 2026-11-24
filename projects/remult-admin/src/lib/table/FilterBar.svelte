<script lang="ts">
  import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@ui-sdk/svelte/popover'
  import { tick } from 'svelte'
  import type { FieldUIInfo } from '../../../../core/server/remult-admin'
  import { settings } from '../core/settings.svelte.js'
  import { operatorsFor, type FilterChip as Chip } from '../query/filter-model.js'
  import { upsertChip } from '../query/filter-labels.js'
  import { captions } from '../relations/caption-cache.svelte.js'
  import Icon, { type IconName } from '../shell/Icon.svelte'
  import FilterChip from './FilterChip.svelte'
  import FilterEditor from './FilterEditor.svelte'

  let {
    fields,
    filters,
    pageCaptions,
    onchange,
  }: {
    fields: FieldUIInfo[]
    filters: Chip[]
    /** The table page's relation captions, by valFieldKey: chips reuse them before asking. */
    pageCaptions: Record<string, Map<unknown, unknown>>
    onchange: (filters: Chip[]) => void
  } = $props()

  const label = (f: FieldUIInfo) => (settings.displayCaption ? f.caption : f.key)
  const byKey = $derived(new Map(fields.map((f) => [f.key, f])))
  const filterable = $derived(fields.filter((f) => operatorsFor(f).length > 0))

  function captionOf(f: FieldUIInfo) {
    return (id: unknown) => pageCaptions[f.valFieldKey]?.get(id) ?? captions.get(f, id)
  }

  // a chip from a shared link names ids this page may not show: look their captions up
  $effect(() => {
    for (const c of filters) {
      const f = byKey.get(c.field)
      if (!f?.relationToOne || !Array.isArray(c.value)) continue
      for (const id of c.value) if (pageCaptions[f.valFieldKey]?.get(id) === undefined) captions.request(f, id)
    }
  })

  let adding = $state(false)
  let picked: FieldUIInfo | undefined = $state.raw()
  let search = $state('')
  let body: HTMLElement | undefined = $state()

  // the popover moved focus in once, on open: each step puts it on its own first control
  async function choose(f: FieldUIInfo | undefined) {
    picked = f
    await tick()
    body?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
  }

  // exact name, then prefix, then anywhere: Enter picks the best match
  function rank(f: FieldUIInfo, q: string) {
    const names = [label(f), f.key].map((x) => x.toLowerCase())
    if (names.includes(q)) return 0
    if (names.some((x) => x.startsWith(q))) return 1
    return names.some((x) => x.includes(q)) ? 2 : -1
  }

  const shown = $derived.by(() => {
    const q = search.trim().toLowerCase()
    if (!q) return filterable
    return filterable
      .map((f) => ({ f, r: rank(f, q) }))
      .filter((x) => x.r >= 0)
      .sort((a, b) => a.r - b.r)
      .map((x) => x.f)
  })

  function typeIcon(f: FieldUIInfo): IconName {
    if (f.relationToOne) return 'relation'
    if (f.values.length) return 'list'
    if (f.type === 'number') return 'hash'
    if (f.type === 'boolean') return 'toggle'
    if (f.type === 'date') return 'calendar'
    return 'type'
  }

  function onListKey(e: KeyboardEvent) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const root = e.currentTarget as HTMLElement
    const all = [...root.querySelectorAll<HTMLElement>('[data-field-option]')]
    const i = all.indexOf(document.activeElement as HTMLElement)
    e.preventDefault()
    const next = e.key === 'ArrowDown' ? all[i + 1] : i <= 0 ? undefined : all[i - 1]
    if (next) next.focus()
    else if (e.key === 'ArrowUp') root.querySelector<HTMLElement>('input')?.focus()
  }
</script>

<div class="filters" role="group" aria-label="Filters">
  {#each filters as c, i (`${c.field}.${c.op}.${i}`)}
    {@const f = byKey.get(c.field)}
    {#if f}
      <FilterChip
        field={f}
        chip={c}
        label={label(f)}
        captionOf={captionOf(f)}
        onapply={(next) => onchange(upsertChip(filters, next, c))}
        onremove={() => onchange(filters.filter((x) => x !== c))}
      />
    {/if}
  {/each}

  <Popover
    bind:open={
      () => adding,
      (v) => {
        adding = v
        if (v) {
          picked = undefined
          search = ''
        }
      }
    }
  >
    <PopoverTrigger class="add" aria-label="Add filter">
      <Icon name={filters.length ? 'plus' : 'filter'} size={13} stroke={filters.length ? 2 : 1.75} />
      {filters.length ? 'Add' : 'Filter'}
    </PopoverTrigger>
    <PopoverContent class="filter-pop" align="start" sideOffset={6} collisionPadding={12} initialFocus="[data-autofocus]">
      <div bind:this={body}>
        {#if picked}
          <PopoverTitle class="sr-only">Filter on {label(picked)}</PopoverTitle>
          <button class="back" type="button" onclick={() => choose(undefined)}>
            <Icon name="chevron-left" size={13} /> Fields
          </button>
          <FilterEditor
            field={picked}
            label={label(picked)}
            captionOf={captionOf(picked)}
            onapply={(c) => {
              adding = false
              onchange(upsertChip(filters, c))
            }}
          />
        {:else}
          <PopoverTitle class="sr-only">Filter by</PopoverTitle>
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="fields" onkeydown={onListKey}>
            <label class="field-search">
              <Icon name="search" size={14} />
              <input
                type="search"
                placeholder="Filter by..."
                aria-label="Find a field"
                data-autofocus
                bind:value={search}
                onkeydown={(e) => {
                  if (e.key === 'Enter' && shown.length) {
                    e.preventDefault()
                    choose(shown[0])
                  }
                }}
              />
            </label>
            <div class="field-list">
              {#each shown as f (f.key)}
                <button class="field-option" type="button" data-field-option onclick={() => choose(f)}>
                  <Icon name={typeIcon(f)} size={13} />
                  <span>{label(f)}</span>
                </button>
              {:else}
                <p class="none">No field matches.</p>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </PopoverContent>
  </Popover>

  {#if filters.length}
    <button class="clear" type="button" onclick={() => onchange([])}>Clear all</button>
  {/if}
</div>

<style>
  .filters {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    min-height: 40px;
    padding: 7px 16px 7px 20px;
    border-bottom: 1px solid var(--border);
  }
  .filters :global(.add) {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 24px;
    padding: 0 8px;
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-muted);
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
    transition-property: background-color, border-color, color, scale;
    transition-duration: 120ms;
    transition-timing-function: var(--ease-out);
  }
  .filters :global(.add:hover),
  .filters :global(.add[data-open]) {
    border-color: color-mix(in oklch, var(--border-strong), var(--text) 20%);
    background: var(--bg-hover);
    color: var(--text);
  }
  .filters :global(.add:active) {
    scale: 0.96;
  }
  .clear {
    margin-inline-start: auto;
    height: 24px;
    padding: 0 8px;
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-muted);
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .clear:hover {
    background: var(--bg-hover);
    color: var(--text);
  }
  .back {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    height: 22px;
    margin: -4px 0 6px -6px;
    padding: 0 6px 0 2px;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-faint);
    font-size: var(--text-xs);
    cursor: pointer;
  }
  .back:hover {
    background: var(--bg-hover);
    color: var(--text);
  }
  .fields {
    display: flex;
    flex-direction: column;
    margin: -12px;
  }
  .field-search {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 38px;
    padding: 0 12px;
    border-bottom: 1px solid var(--border);
    color: var(--text-faint);
  }
  .field-search input {
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--text);
    outline: none;
  }
  .field-search input::placeholder {
    color: var(--text-faint);
  }
  .field-search input::-webkit-search-cancel-button {
    display: none;
  }
  .field-list {
    max-height: 300px;
    overflow-y: auto;
    padding: 4px;
  }
  .field-option {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 28px;
    padding: 0 8px;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text);
    text-align: start;
    cursor: pointer;
  }
  .field-option :global(svg) {
    flex: none;
    color: var(--text-faint);
  }
  .field-option:hover,
  .field-option:focus-visible {
    background: var(--bg-hover);
    outline: none;
  }
  .field-option span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .none {
    margin: 0;
    padding: 8px;
    color: var(--text-faint);
    font-size: var(--text-sm);
  }
</style>
