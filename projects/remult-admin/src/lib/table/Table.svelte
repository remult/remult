<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { onDestroy, untrack } from 'svelte'
  import type { EntityFilter } from '../../../../core/index.js'
  import type { FieldUIInfo } from '../../../../core/server/remult-admin'
  import type { TableInfo } from '../core/god.svelte.js'
  import { session, settings } from '../core/settings.svelte.js'
  import { chipsToWhere, type FilterChip, type TableQuery } from '../query/filter-model.js'
  import { parseQuery, serializeQuery } from '../query/url-state.js'
  import Icon, { type IconName } from '../shell/Icon.svelte'
  import { toast } from '../shell/Toasts.svelte'
  import { valueKey } from './format.js'
  import Row from './Row.svelte'
  import { errorMessage, TableData, type LoadRequest, type TableRow } from './table-data.svelte.js'

  let {
    table,
    parentWhere,
    urlBound = false,
    oncreate,
  }: {
    /** Fixed for the component's life: key the parent on it to switch entity. */
    table: TableInfo
    parentWhere?: EntityFilter<any>
    urlBound?: boolean
    oncreate?: () => void
  } = $props()

  // svelte-ignore state_referenced_locally
  const data = new TableData(table)
  onDestroy(() => data.dispose())

  const path = $derived(`#/entity/${table.superKey}`)
  const label = (x: { caption: string; key: string }) => (settings.displayCaption ? x.caption : x.key)

  let localQuery: TableQuery = $state({ filters: [], page: 1 })
  // the page outlives a navigation away by a tick: only read the URL while it is ours
  const urlParams = $derived(
    urlBound && page.url.hash.split('?')[0] === path
      ? new URLSearchParams(page.url.hash.split('?')[1] ?? '')
      : undefined,
  )
  const query: TableQuery = $derived(urlParams ? parseQuery(urlParams, table.fields) : localQuery)

  function hrefFor(q: TableQuery) {
    const qs = serializeQuery(q, table.fields).toString()
    return qs ? `${path}?${qs}` : path
  }

  function setQuery(q: TableQuery) {
    if (urlBound) goto(hrefFor(q), { reset: false })
    else localQuery = q
  }

  $effect(() => {
    if (!urlParams) return
    const normal = serializeQuery(query, table.fields).toString()
    // drop unknown or invalid params without adding a history entry
    if (normal !== urlParams.toString())
      untrack(() => goto(hrefFor(query), { replace: true, reset: false }))
  })

  const known = $derived(new Set(table.repo.metadata.fields.toArray().map((f) => f.key)))
  const idOrder = $derived(Object.fromEntries(Object.keys(table.ids).map((k) => [k, 'asc' as const])))
  const byKey = $derived(new Map(table.fields.map((f) => [f.key, f])))

  const orderBy = $derived.by(() => {
    if (query.sort) {
      const f = byKey.get(query.sort.field)
      // ids break ties, so a row never shows on two pages
      if (f) return { [valueKey(f)]: query.sort.dir, ...idOrder }
    }
    const fromServer = Object.entries(table.defaultOrderBy ?? {}).filter(([k]) => known.has(k))
    return fromServer.length ? { ...Object.fromEntries(fromServer), ...idOrder } : idOrder
  })

  const live = $derived(!window.optionsFromServer?.disableLiveQuery && settings.disableLiveQuery !== true)

  const request: LoadRequest = $derived.by(() => {
    const where = chipsToWhere(query.filters, table.fields)
    return {
      where: parentWhere ? { $and: [where, parentWhere] } : where,
      orderBy,
      page: query.page,
      limit: settings.numberOfRows,
      live,
    }
  })
  // new objects on every URL read: reload only when the request itself changed
  const requestKey = $derived(JSON.stringify(request))

  $effect(() => {
    requestKey
    untrack(() => data.load(request))
  })

  const forbidden = $derived(session.forbiddenEntities.includes(table.key))
  const from = $derived((query.page - 1) * settings.numberOfRows + 1)
  const to = $derived(from + data.rows.length - 1)
  const isLast = $derived(data.total === undefined ? data.rows.length < settings.numberOfRows : to >= data.total)

  function toggleSort(f: FieldUIInfo) {
    const cur = query.sort?.field === f.key ? query.sort.dir : undefined
    const sort =
      cur === undefined
        ? { field: f.key, dir: 'desc' as const }
        : cur === 'desc'
          ? { field: f.key, dir: 'asc' as const }
          : undefined
    setQuery({ ...query, sort, page: 1 })
  }

  function typeIcon(f: FieldUIInfo): IconName {
    if (f.relationToOne) return 'relation'
    if (f.values.length) return 'list'
    if (f.type === 'number') return 'hash'
    if (f.type === 'boolean') return 'toggle'
    if (f.type === 'date') return 'calendar'
    if (f.type === 'json') return 'braces'
    return 'type'
  }

  const typeName = (f: FieldUIInfo) =>
    f.relationToOne ? 'relation' : f.values.length ? 'value list' : f.type

  const OPS: Record<FilterChip['op'], string> = {
    eq: 'is',
    ne: 'is not',
    contains: 'contains',
    startsWith: 'starts with',
    gt: 'after',
    gte: '>=',
    lt: 'before',
    lte: '<=',
    between: 'between',
    in: 'is any of',
    nin: 'is none of',
    empty: 'is empty',
    notEmpty: 'is not empty',
  }

  function chipText(c: FilterChip) {
    const f = byKey.get(c.field)
    const name = f ? label(f) : c.field
    const op = f?.type === 'number' && (c.op === 'gt' || c.op === 'lt') ? (c.op === 'gt' ? '>' : '<') : OPS[c.op]
    if (c.op === 'empty' || c.op === 'notEmpty') return `${name} ${op}`
    const v = Array.isArray(c.value) ? c.value.join(', ') : String(c.value)
    return c.op === 'between' ? `${name} ${op} ${v} and ${String(c.value2)}` : `${name} ${op} ${v}`
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(location.href)
      toast.success('Link copied')
    } catch {
      toast.error('Could not copy the link')
    }
  }

  async function deleteRow(row: TableRow) {
    try {
      await data.delete(row)
      toast.success('Row deleted')
    } catch (err) {
      toast.error(`Delete failed: ${errorMessage(err)}`)
    }
  }

  const skeletonRows = $derived(Math.min(settings.numberOfRows, 12))
  const canInsert = $derived(table.permissions.insert !== false)
</script>

{#snippet newButton()}
  {#if canInsert}
    <button class="btn" data-variant="primary" type="button" onclick={() => oncreate?.()}>
      <Icon name="plus" size={14} stroke={2} /> New
    </button>
  {/if}
{/snippet}

<section class="table" class:nested={!urlBound} style:--hue={table.color}>
  <header class="bar">
    {#if urlBound}
      <h1><span class="hue-dot"></span>{label(table)}</h1>
    {/if}
    {#if forbidden}
      <span class="badge danger"><Icon name="lock" size={12} /> Forbidden</span>
    {:else if table.permissions.update === false}
      <span class="badge" title="Rows of this entity can't be edited"><Icon name="lock" size={12} /> Read only</span>
    {/if}
    {#if live && data.loaded && !data.error}
      <span class="live" title="Rows update as the data changes">Live</span>
    {/if}

    <div class="spacer"></div>

    {#if data.loaded && !data.error}
      <span class="range" aria-live="polite">
        {#if data.rows.length}
          {from} - {to} <span class="of">of</span> {data.total ?? '?'}
        {:else}
          {data.total ?? 0} rows
        {/if}
      </span>
    {/if}
    <div class="pager">
      <button
        class="btn"
        data-variant="ghost"
        data-icon
        type="button"
        aria-label="Previous page"
        title="Previous page"
        disabled={query.page <= 1}
        onclick={() => setQuery({ ...query, page: query.page - 1 })}
      >
        <Icon name="chevron-left" />
      </button>
      <button
        class="btn"
        data-variant="ghost"
        data-icon
        type="button"
        aria-label="Next page"
        title="Next page"
        disabled={!data.loaded || isLast}
        onclick={() => setQuery({ ...query, page: query.page + 1 })}
      >
        <Icon name="chevron-right" />
      </button>
    </div>
    {#if urlBound}
      <button class="btn" data-variant="ghost" type="button" onclick={copyLink}>
        <Icon name="copy" size={14} /> Copy link
      </button>
    {/if}
    {@render newButton()}
  </header>

  {#if query.filters.length}
    <div class="filters" aria-label="Filters">
      <Icon name="filter" size={13} />
      {#each query.filters as c, i (i)}
        <span class="chip">{chipText(c)}</span>
      {/each}
      <button class="link" type="button" onclick={() => setQuery({ ...query, filters: [], page: 1 })}>
        Clear filters
      </button>
    </div>
  {/if}

  <div class="scroll" aria-busy={data.loading}>
    {#if data.error}
      <div class="state" role="alert">
        <span class="state-icon danger"><Icon name={forbidden ? 'lock' : 'alert'} size={20} /></span>
        <h2>{forbidden ? `You can't read ${label(table)}` : `Could not load ${label(table)}`}</h2>
        <pre>{data.error}</pre>
        <button class="btn" type="button" onclick={() => data.load(request)}>
          <Icon name="refresh" size={14} /> Retry
        </button>
      </div>
    {:else}
      <table class="grid" data-loading={data.loaded && data.loading ? '' : undefined}>
        <thead>
          <tr>
            <th class="gutter"><span class="sr-only">Row status</span></th>
            {#each table.fields as f (f.key)}
              {@const dir = query.sort?.field === f.key ? query.sort.dir : undefined}
              <th
                aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : undefined}
                data-num={f.type === 'number' && !f.values.length && !f.relationToOne ? '' : undefined}
              >
                <button
                  type="button"
                  class="head"
                  title={`${label(f)} (${typeName(f)}). Sort`}
                  onclick={() => toggleSort(f)}
                >
                  {#if table.ids[f.key]}<span class="key" title="Id"><Icon name="key" size={12} /></span>{/if}
                  <span class="name">{label(f)}</span>
                  <span class="sort" data-dir={dir}>
                    <Icon name={dir === 'asc' ? 'arrow-up' : 'arrow-down'} size={12} stroke={2} />
                  </span>
                  <span class="type"><Icon name={typeIcon(f)} size={12} /></span>
                </button>
              </th>
            {/each}
            <th class="actions"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {#if !data.loaded}
            {#each { length: skeletonRows }, i (i)}
              <tr class="skeleton">
                <td class="gutter"></td>
                {#each table.fields as f, j (f.key)}
                  <td><span style:--w="{40 + ((i * 7 + j * 13) % 50)}%"></span></td>
                {/each}
                <td class="actions"></td>
              </tr>
            {/each}
          {:else}
            {#each data.rows as row (row.id)}
              <Row
                {row}
                fields={table.fields}
                captions={data.captions}
                canUpdate={data.can('update', row.id)}
                canDelete={data.can('delete', row.id)}
                resolved={data.resolved(row.id)}
                ondelete={deleteRow}
              />
            {/each}
          {/if}
        </tbody>
      </table>

      {#if data.loaded && !data.rows.length}
        <div class="state empty">
          <span class="state-icon"><Icon name="table" size={20} /></span>
          <h2>No rows</h2>
          {#if query.filters.length}
            <p>Nothing matches these filters.</p>
            <div class="state-actions">
              <button class="btn" type="button" onclick={() => setQuery({ ...query, filters: [], page: 1 })}>
                Clear filters
              </button>
              {@render newButton()}
            </div>
          {:else if query.page > 1}
            <p>Page {query.page} is past the last row.</p>
            <button class="btn" type="button" onclick={() => setQuery({ ...query, page: 1 })}>Go to first page</button>
          {:else}
            <p>{label(table)} has no rows yet.</p>
            {@render newButton()}
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</section>

<style>
  .table {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
  }
  .table.nested {
    height: auto;
    max-height: 480px;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    min-height: 48px;
    padding: 8px 16px 8px 20px;
    border-bottom: 1px solid var(--border);
  }
  .nested .bar {
    min-height: 40px;
    padding: 4px 8px 4px 12px;
  }
  h1 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 4px 0 0;
    font-size: var(--text-lg);
    font-weight: 600;
    letter-spacing: -0.01em;
    white-space: nowrap;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 20px;
    padding: 0 7px;
    border-radius: 10px;
    background: var(--bg-inset);
    box-shadow: inset 0 0 0 1px var(--border);
    color: var(--text-muted);
    font-size: var(--text-xs);
    font-weight: 500;
  }
  .badge.danger {
    background: var(--danger-soft);
    box-shadow: none;
    color: var(--danger);
  }
  .live {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--text-faint);
    font-size: var(--text-xs);
  }
  .live::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--success);
    box-shadow: 0 0 0 3px color-mix(in oklch, var(--success) 18%, transparent);
  }
  .spacer {
    flex: 1;
  }
  .range {
    color: var(--text-muted);
    font-size: var(--text-sm);
    white-space: nowrap;
  }
  .of {
    color: var(--text-faint);
  }
  .pager {
    display: flex;
  }
  .filters {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    padding: 6px 16px 6px 20px;
    border-bottom: 1px solid var(--border);
    color: var(--text-faint);
  }
  .chip {
    padding: 0 8px;
    border-radius: 10px;
    background: var(--accent-soft);
    color: var(--text);
    font-size: var(--text-sm);
    line-height: 20px;
  }
  .link {
    border: 0;
    padding: 0 4px;
    background: none;
    color: var(--accent);
    font-size: var(--text-sm);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .scroll {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
  .grid {
    min-width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    transition: opacity 150ms var(--ease-out);
  }
  .grid[data-loading] {
    opacity: 0.6;
  }
  .grid :global(td) {
    border-bottom: 1px solid var(--border);
  }
  th {
    position: sticky;
    top: 0;
    z-index: 1;
    height: 32px;
    padding: 0;
    background: var(--bg-nav);
    border-bottom: 1px solid var(--border);
    text-align: start;
    font-weight: 500;
    white-space: nowrap;
  }
  th.gutter {
    width: 28px;
  }
  th.actions {
    right: 0;
    z-index: 2;
    width: 1%;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    height: 32px;
    padding: 0 12px;
    border: 0;
    background: transparent;
    color: var(--text-muted);
    font-size: var(--text-sm);
    font-weight: 550;
    text-align: start;
    cursor: pointer;
    transition: color 100ms var(--ease-out), background-color 100ms var(--ease-out);
  }
  .head:hover {
    background: var(--bg-hover);
    color: var(--text);
  }
  .head:focus-visible {
    outline-offset: -2px;
  }
  th[data-num] .head {
    justify-content: flex-end;
  }
  th[aria-sort] .head {
    color: var(--text);
  }
  .key {
    display: flex;
    color: var(--warning);
  }
  .sort {
    display: flex;
    color: var(--accent);
    opacity: 0;
    transition: opacity 100ms var(--ease-out);
  }
  .sort[data-dir] {
    opacity: 1;
  }
  .head:hover .sort:not([data-dir]) {
    opacity: 0.4;
    color: var(--text-faint);
  }
  .type {
    display: flex;
    margin-inline-start: auto;
    padding-inline-start: 8px;
    color: var(--text-faint);
  }
  th[data-num] .type {
    order: -1;
    margin-inline-start: 0;
    padding: 0 2px 0 0;
  }
  .skeleton td {
    height: var(--row-h);
    padding: 0 12px;
  }
  .skeleton td span {
    display: block;
    width: var(--w);
    min-width: 24px;
    max-width: 160px;
    height: 8px;
    border-radius: 4px;
    background: var(--bg-active);
    animation: pulse 1.4s ease-in-out infinite;
  }
  @keyframes pulse {
    50% {
      opacity: 0.5;
    }
  }
  .state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 48px 16px;
    text-align: center;
  }
  .state h2 {
    margin: 8px 0 0;
    font-size: var(--text-lg);
    font-weight: 600;
  }
  .state p {
    margin: 0 0 8px;
    color: var(--text-muted);
  }
  .state pre {
    max-width: min(640px, 100%);
    margin: 0 0 8px;
    padding: 8px 12px;
    overflow: auto;
    border-radius: var(--radius);
    background: var(--bg-inset);
    color: var(--text-muted);
    font-family: var(--mono);
    font-size: var(--text-sm);
    text-align: start;
    white-space: pre-wrap;
  }
  .state-icon {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--bg-inset);
    box-shadow: inset 0 0 0 1px var(--border);
    color: var(--text-muted);
  }
  .state-icon.danger {
    color: var(--danger);
    background: var(--danger-soft);
    box-shadow: none;
  }
  .state-actions {
    display: flex;
    gap: 8px;
  }
</style>
