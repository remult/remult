<script lang="ts">
  import { onDestroy } from 'svelte'
  import type { FieldUIInfo } from '../../../../core/server/remult-admin'
  import { captions } from '../relations/caption-cache.svelte.js'
  import { RelationSearch } from '../relations/relation-search.svelte.js'
  import Icon from '../shell/Icon.svelte'

  let {
    field,
    value,
    label,
    captionOf,
    onchange,
  }: {
    field: FieldUIInfo
    value: unknown[]
    label: string
    captionOf: (id: unknown) => unknown
    onchange: (value: unknown[]) => void
  } = $props()

  // an enum this long earns a search box too
  const SEARCH_FROM = 8

  const relation = $derived(!!field.relationToOne)
  // svelte-ignore state_referenced_locally
  const search = field.relationToOne ? new RelationSearch(field) : undefined
  onDestroy(() => search?.dispose())
  search?.search('')

  let query = $state('')
  let list: HTMLElement | undefined = $state()

  const key = (v: unknown) => `${typeof v}:${String(v)}`
  const picked = $derived(new Set(value.map(key)))
  const showSearch = $derived(relation || field.values.length > SEARCH_FROM)

  type Option = { id: unknown; caption: string }
  const text = (id: unknown, c: unknown) => (c === undefined || c === null || c === '' ? String(id) : String(c))

  const options: Option[] = $derived.by(() => {
    if (search) {
      const found = search.items.map((x) => ({ id: x.id, caption: text(x.id, x.caption) }))
      const ids = new Set(found.map((o) => key(o.id)))
      // picked values stay on top, even when the search moved past them
      const kept = query.trim()
        ? []
        : value.filter((id) => !ids.has(key(id))).map((id) => ({ id, caption: text(id, captionOf(id)) }))
      return [...kept, ...found]
    }
    const q = query.trim().toLowerCase()
    return field.values
      .filter((v) => !q || v.caption.toLowerCase().includes(q))
      .map((v) => ({ id: v.id, caption: v.caption }))
  })

  const more = $derived(!!search && search.count !== undefined && search.count > search.items.length)

  function toggle(o: Option, on: boolean) {
    if (field.relationToOne) captions.set(field, o.id, o.caption)
    onchange(on ? [...value, o.id] : value.filter((v) => key(v) !== key(o.id)))
  }

  function boxes() {
    return [...(list?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]') ?? [])]
  }

  function onSearchKey(e: KeyboardEvent) {
    if (e.key !== 'ArrowDown') return
    e.preventDefault()
    boxes()[0]?.focus()
  }

  function onListKey(e: KeyboardEvent) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const all = boxes()
    const i = all.indexOf(e.target as HTMLInputElement)
    if (i < 0) return
    e.preventDefault()
    const next = all[i + (e.key === 'ArrowDown' ? 1 : -1)]
    if (next) next.focus()
    else if (e.key === 'ArrowUp') list?.parentElement?.querySelector<HTMLInputElement>('.check-search input')?.focus()
  }
</script>

<div class="checklist">
  {#if showSearch}
    <label class="check-search">
      <Icon name="search" size={14} />
      <input
        class="search-input"
        type="search"
        placeholder={relation ? 'Search...' : 'Filter values...'}
        aria-label={`Search ${label}`}
        data-autofocus
        bind:value={query}
        oninput={() => search?.search(query)}
        onkeydown={onSearchKey}
      />
    </label>
  {/if}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="options"
    role="group"
    aria-label={label}
    aria-busy={search?.loading || undefined}
    bind:this={list}
    onkeydown={onListKey}
  >
    {#each options as o, i (key(o.id))}
      <label class="option">
        <input
          type="checkbox"
          checked={picked.has(key(o.id))}
          data-autofocus={!showSearch && i === 0 ? '' : undefined}
          onchange={(e) => toggle(o, e.currentTarget.checked)}
        />
        <span class="check" aria-hidden="true"><Icon name="check" size={11} stroke={2.5} /></span>
        <span class="option-label">{o.caption}</span>
      </label>
    {:else}
      <p class="none">
        {#if search?.error}
          <span class="error">{search.error}</span>
        {:else if search?.loading}
          Searching...
        {:else}
          {query ? `No match for "${query}"` : 'No values'}
        {/if}
      </p>
    {/each}
  </div>
  {#if more || value.length}
    <div class="foot">
      {#if more}<span>{search?.items.length} of {search?.count}, type to narrow</span>{/if}
      {#if value.length}
        <span class="count">{value.length} selected</span>
        <button class="link" type="button" onclick={() => onchange([])}>Clear</button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .checklist {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    background: var(--bg-raised);
    overflow: hidden;
  }
  .check-search {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 32px;
    padding: 0 10px;
    border-bottom: 1px solid var(--border);
    color: var(--text-faint);
  }
  .check-search:focus-within {
    color: var(--accent);
  }
  .search-input {
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--text);
    outline: none;
  }
  .search-input::placeholder {
    color: var(--text-faint);
  }
  .search-input::-webkit-search-cancel-button {
    display: none;
  }
  .options {
    max-height: 232px;
    overflow-y: auto;
    padding: 4px;
  }
  .options[aria-busy='true'] {
    opacity: 0.7;
  }
  .option {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 28px;
    padding: 0 8px;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }
  .option:hover,
  .option:has(input:focus-visible) {
    background: var(--bg-hover);
  }
  /* the whole row is the hit area */
  .option input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }
  .check {
    display: grid;
    flex: none;
    place-items: center;
    width: 14px;
    height: 14px;
    border-radius: 3px;
    box-shadow: inset 0 0 0 1px var(--border-strong);
    color: transparent;
    transition:
      background-color 100ms var(--ease-out),
      color 100ms var(--ease-out);
  }
  .option input:checked + .check {
    background: var(--accent);
    box-shadow: none;
    color: var(--accent-text);
  }
  .option input:focus-visible + .check {
    outline: 2px solid var(--ring);
    outline-offset: 1px;
  }
  .option-label {
    min-width: 0;
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
  .error {
    color: var(--danger);
  }
  .foot {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 28px;
    padding: 0 10px;
    border-top: 1px solid var(--border);
    color: var(--text-faint);
    font-size: var(--text-xs);
  }
  .count {
    margin-inline-start: auto;
    color: var(--text-muted);
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font-size: var(--text-xs);
    cursor: pointer;
  }
  .link:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
</style>
