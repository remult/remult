<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { onDestroy, tick, untrack } from 'svelte'
  import { SvelteSet } from 'svelte/reactivity'
  import type { EntityFilter } from '../../../../core/index.js'
  import type {
    AdminEditMode,
    FieldUIInfo,
  } from '../../../../core/server/remult-admin'
  import type { TableInfo } from '../core/god.svelte.js'
  import { session, settings } from '../core/settings.svelte.js'
  import {
    chipsToWhere,
    type FilterChip,
    type TableQuery,
  } from '../query/filter-model.js'
  import { parseQuery, serializeQuery } from '../query/url-state.js'
  import Icon, { type IconName } from '../shell/Icon.svelte'
  import { toast } from '../shell/Toasts.svelte'
  import { orderByFor } from './order.js'
  import FilterBar from './FilterBar.svelte'
  import RelationTabs from './RelationTabs.svelte'
  import Row from './Row.svelte'
  import RowDrawer from './RowDrawer.svelte'
  import {
    errorMessage,
    prefillFrom,
    TableData,
    type LoadRequest,
    type TableRow,
  } from './table-data.svelte.js'

  let {
    table,
    parentWhere,
    urlBound = false,
  }: {
    /** Fixed for the component's life: key the parent on it to switch entity. */
    table: TableInfo
    parentWhere?: EntityFilter<any>
    urlBound?: boolean
  } = $props()

  // svelte-ignore state_referenced_locally
  const data = new TableData(table)
  onDestroy(() => data.dispose())

  const path = $derived(`#/entity/${table.superKey}`)
  const label = (x: { caption: string; key: string }) =>
    settings.displayCaption ? x.caption : x.key

  let localQuery: TableQuery = $state({ filters: [], page: 1 })
  // the page outlives a navigation away by a tick: only read the URL while it is ours
  const urlParams = $derived(
    urlBound && page.url.hash.split('?')[0] === path
      ? new URLSearchParams(page.url.hash.split('?')[1] ?? '')
      : undefined,
  )
  const query: TableQuery = $derived(
    urlParams ? parseQuery(urlParams, table.fields) : localQuery,
  )

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

  const known = $derived(
    new Set(table.repo.metadata.fields.toArray().map((f) => f.key)),
  )
  const byKey = $derived(new Map(table.fields.map((f) => [f.key, f])))

  const orderBy = $derived(
    orderByFor(query.sort, {
      fields: table.fields,
      ids: table.ids,
      defaultOrderBy: table.defaultOrderBy as
        | Record<string, unknown>
        | undefined,
      known,
    }),
  )

  const editMode: AdminEditMode = $derived(
    table.editModeLocked
      ? table.editMode
      : (settings.editMode[table.superKey] ?? table.editMode),
  )
  const showModeSwitch = $derived(
    urlBound &&
      !table.editModeLocked &&
      (table.permissions.update !== false ||
        table.permissions.insert !== false),
  )
  const modes: { value: AdminEditMode; label: string; title: string }[] = [
    { value: 'inline', label: 'Inline', title: 'Edit in the table' },
    {
      value: 'drawer',
      label: 'Drawer',
      title: 'Edit one row at a time in a side panel',
    },
  ]

  const live = $derived(
    !window.optionsFromServer?.disableLiveQuery &&
      settings.disableLiveQuery !== true,
  )

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
  const isLast = $derived(
    data.total === undefined
      ? data.rows.length < settings.numberOfRows
      : to >= data.total,
  )

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

  function setFilters(filters: FilterChip[]) {
    setQuery({ ...query, filters, page: 1 })
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(location.href)
      toast.success('Link copied')
    } catch {
      toast.error('Could not copy the link')
    }
  }

  let section: HTMLElement
  let drawer: RowDrawer | undefined = $state()

  async function addRow() {
    if (editMode === 'drawer') {
      drawer?.create(prefillFrom(parentWhere))
      return
    }
    const row = data.addNew(prefillFrom(parentWhere))
    await tick()
    section
      .querySelector<HTMLElement>(`tr[data-row="${row.id}"] [data-cell-focus]`)
      ?.focus()
  }

  async function saveRows(rows: TableRow[]) {
    const results = await Promise.all(
      rows.map(async (row) => ({ row, r: await data.save(row) })),
    )
    for (const { r } of results)
      if (!r.ok && r.message) toast.error(`Save failed: ${r.message}`)
    const added = results.filter(({ row, r }) => r.ok && row.isNew).length
    const saved = results.filter(({ r }) => r.ok).length
    if (added) toast.success(added === 1 ? 'Row added' : `${added} rows added`)
    else if (saved > 1) toast.success(`${saved} rows saved`)
  }

  function rowOf(target: EventTarget | null) {
    const id = (target as HTMLElement | null)?.closest<HTMLElement>(
      'tr[data-row]',
    )?.dataset.row
    return id === undefined ? undefined : data.find(id)
  }

  function onkeydown(e: KeyboardEvent) {
    const target = e.target as HTMLElement
    // a dialog or a nested table above us owns its keys
    if (
      e.defaultPrevented ||
      target.closest('[role="dialog"]') ||
      target.closest('section.table') !== section
    )
      return
    const mod = e.ctrlKey || e.metaKey
    // plain Esc too: Windows keeps Ctrl+Esc for itself; an open list closes first
    const cancel =
      e.key === 'Escape' &&
      !e.altKey &&
      !target.closest('[role="listbox"], [aria-expanded="true"]')
    if ((mod && e.key === 'Enter') || cancel) {
      const one = rowOf(target)
      const rows = e.shiftKey
        ? data.dirtyRows()
        : one && (one.isNew || one.draft.dirty)
          ? [one]
          : []
      if (!rows.length) return
      e.preventDefault()
      if (e.key === 'Enter') saveRows(rows)
      else for (const r of rows) data.cancel(r)
      return
    }
    if (
      (e.key === 'ArrowUp' || e.key === 'ArrowDown') &&
      !e.altKey &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.shiftKey
    ) {
      if (target.matches('tr[data-row]')) moveRow(e, target)
      else moveVertical(e, target)
    }
  }

  // a focused row (drawer mode) steps to the next focusable row
  function moveRow(e: KeyboardEvent, tr: HTMLElement) {
    let next = (
      e.key === 'ArrowDown' ? tr.nextElementSibling : tr.previousElementSibling
    ) as HTMLElement | null
    while (next && !next.matches('tr[tabindex]'))
      next = (
        e.key === 'ArrowDown'
          ? next.nextElementSibling
          : next.previousElementSibling
      ) as HTMLElement | null
    if (!next) return
    e.preventDefault()
    next.focus()
  }

  // these use the arrow keys themselves: step a number, a date part, or move in a list
  const OWN_ARROWS =
    'input[type="number"], input[type="date"], input[type="datetime-local"], [role="combobox"]'

  // same column, next row that has an editor there
  function moveVertical(e: KeyboardEvent, target: HTMLElement) {
    if (!target.matches('[data-cell-focus]') || target.matches(OWN_ARROWS))
      return
    const td = target.closest('td')
    const tr = td?.parentElement as HTMLTableRowElement | null
    if (!td || !tr) return
    const i = [...tr.cells].indexOf(td as HTMLTableCellElement)
    let next = (
      e.key === 'ArrowDown' ? tr.nextElementSibling : tr.previousElementSibling
    ) as HTMLTableRowElement | null
    while (next) {
      const el = next.cells[i]?.querySelector<HTMLElement>('[data-cell-focus]')
      if (el) {
        e.preventDefault()
        el.focus()
        return
      }
      next = (
        e.key === 'ArrowDown'
          ? next.nextElementSibling
          : next.previousElementSibling
      ) as HTMLTableRowElement | null
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

  const expandable = $derived(table.relations.length > 0)
  // row ids whose related rows show; local to this table, like its query
  const expanded = new SvelteSet<string>()
  let viewWidth = $state(0)
  const columns = $derived(table.fields.length + 2 + (expandable ? 1 : 0))

  function toggle(row: TableRow) {
    if (expanded.has(row.id)) expanded.delete(row.id)
    else expanded.add(row.id)
  }

  const skeletonRows = $derived(Math.min(settings.numberOfRows, 12))
  const canInsert = $derived(table.permissions.insert !== false)
</script>

{#snippet newButton()}
  {#if canInsert}
    <button class="btn" data-variant="primary" type="button" onclick={addRow}>
      <Icon name="plus" size={14} stroke={2} /> New
    </button>
  {/if}
{/snippet}

<!-- keyboard shortcuts for the rows inside; the editors stay the focus targets -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<section
  class="table"
  class:nested={!urlBound}
  style:--hue={table.color}
  bind:this={section}
  {onkeydown}
>
  <header class="bar">
    {#if urlBound}
      <h1><span class="hue-dot"></span>{label(table)}</h1>
    {/if}
    {#if forbidden}
      <span class="badge danger"><Icon name="lock" size={12} /> Forbidden</span>
    {:else if table.permissions.update === false}
      <span class="badge" title="Rows of this entity can't be edited"
        ><Icon name="lock" size={12} /> Read only</span
      >
    {/if}
    {#if live && data.loaded && !data.error}
      <span class="live" title="Rows update as the data changes">Live</span>
    {/if}

    <div class="spacer"></div>

    {#if showModeSwitch}
      <div class="segmented" role="radiogroup" aria-label="Edit mode">
        {#each modes as m (m.value)}
          <label
            class="seg"
            title={m.title}
            data-checked={editMode === m.value ? '' : undefined}
          >
            <input
              type="radio"
              name={`edit-mode-${table.superKey}`}
              value={m.value}
              checked={editMode === m.value}
              onchange={() => (settings.editMode[table.superKey] = m.value)}
            />
            {m.label}
          </label>
        {/each}
      </div>
    {/if}

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

  <FilterBar
    fields={table.fields}
    filters={query.filters}
    pageCaptions={data.captions}
    onchange={setFilters}
  />

  <div class="scroll" aria-busy={data.loading} bind:clientWidth={viewWidth}>
    {#if data.error}
      <div class="state" role="alert">
        <span class="state-icon danger"
          ><Icon name={forbidden ? 'lock' : 'alert'} size={20} /></span
        >
        <h2>
          {forbidden
            ? `You can't read ${label(table)}`
            : `Could not load ${label(table)}`}
        </h2>
        <pre>{data.error}</pre>
        <button class="btn" type="button" onclick={() => data.load(request)}>
          <Icon name="refresh" size={14} /> Retry
        </button>
      </div>
    {:else}
      <table
        class="grid"
        data-loading={data.loaded && data.loading ? '' : undefined}
      >
        <thead>
          <tr>
            {#if expandable}<th class="expand"
                ><span class="sr-only">Related rows</span></th
              >{/if}
            <th class="gutter"><span class="sr-only">Row status</span></th>
            {#each table.fields as f (f.key)}
              {@const dir =
                query.sort?.field === f.key ? query.sort.dir : undefined}
              <th
                aria-sort={dir === 'asc'
                  ? 'ascending'
                  : dir === 'desc'
                    ? 'descending'
                    : undefined}
                data-num={f.type === 'number' &&
                !f.values.length &&
                !f.relationToOne
                  ? ''
                  : undefined}
              >
                <button
                  type="button"
                  class="head"
                  title={`${label(f)} (${typeName(f)}). Sort`}
                  onclick={() => toggleSort(f)}
                >
                  {#if table.ids[f.key]}<span class="key" title="Id"
                      ><Icon name="key" size={12} /></span
                    >{/if}
                  <span class="name">{label(f)}</span>
                  <span class="sort" data-dir={dir}>
                    <Icon
                      name={dir === 'asc' ? 'arrow-up' : 'arrow-down'}
                      size={12}
                      stroke={2}
                    />
                  </span>
                  <span class="type"><Icon name={typeIcon(f)} size={12} /></span
                  >
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
                {#if expandable}<td class="gutter"></td>{/if}
                <td class="gutter"></td>
                {#each table.fields as f, j (f.key)}
                  <td
                    ><span style:--w="{40 + ((i * 7 + j * 13) % 50)}%"
                    ></span></td
                  >
                {/each}
                <td class="actions"></td>
              </tr>
            {/each}
          {:else}
            {#each [...data.newRows, ...data.rows] as row (row.id)}
              <Row
                {row}
                fields={table.fields}
                captions={data.captions}
                canUpdate={!row.isNew && data.can('update', row.id)}
                canDelete={!row.isNew && data.can('delete', row.id)}
                resolved={row.isNew || data.resolved(row.id)}
                editable={editMode === 'inline'}
                busy={!!data.saving[row.id]}
                errors={data.errors[row.id]}
                ondelete={deleteRow}
                onsave={(r) => saveRows([r])}
                oncancel={(r) => data.cancel(r)}
                onedit={(r, k) => data.clearError(r, k)}
                onopen={(r) => drawer?.edit(r)}
                active={drawer?.openId() === row.id}
                {expandable}
                expanded={expanded.has(row.id)}
                ontoggle={toggle}
              />
              {#if expandable && !row.isNew && expanded.has(row.id)}
                <tr class="related">
                  <td colspan={columns}>
                    <div
                      class="related-inner"
                      style:width={viewWidth ? `${viewWidth}px` : undefined}
                    >
                      <RelationTabs
                        relations={table.relations}
                        values={row.item}
                        label={row.id}
                      />
                    </div>
                  </td>
                </tr>
              {/if}
            {/each}
          {/if}
        </tbody>
      </table>

      {#if data.loaded && !data.rows.length && !data.newRows.length}
        <div class="state empty">
          <span class="state-icon"><Icon name="table" size={20} /></span>
          <h2>No rows</h2>
          {#if query.filters.length}
            <p>Nothing matches these filters.</p>
            <div class="state-actions">
              <button class="btn" type="button" onclick={() => setFilters([])}>
                Clear filters
              </button>
              {@render newButton()}
            </div>
          {:else if query.page > 1}
            <p>Page {query.page} is past the last row.</p>
            <button
              class="btn"
              type="button"
              onclick={() => setQuery({ ...query, page: 1 })}
              >Go to first page</button
            >
          {:else}
            <p>{label(table)} has no rows yet.</p>
            {@render newButton()}
          {/if}
        </div>
      {/if}
    {/if}
  </div>
  <RowDrawer bind:this={drawer} {table} {data} />
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
  th.expand {
    width: 24px;
    min-width: 24px;
  }
  .related > td {
    padding: 0;
  }
  /* the table scrolls sideways: the nested panel stays in view */
  .related-inner {
    position: sticky;
    left: 0;
  }
  th.gutter {
    width: 28px;
    min-width: 28px;
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
    transition:
      color 100ms var(--ease-out),
      background-color 100ms var(--ease-out);
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
  .segmented {
    display: inline-flex;
    padding: 2px;
    border-radius: 7px;
    background: var(--bg-inset);
    box-shadow: inset 0 0 0 1px var(--border);
  }
  .seg {
    position: relative;
    display: inline-flex;
    align-items: center;
    height: 22px;
    padding: 0 9px;
    border-radius: 5px;
    color: var(--text-muted);
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
    transition:
      background-color 120ms var(--ease-out),
      color 120ms var(--ease-out);
  }
  .seg:hover {
    color: var(--text);
  }
  .seg[data-checked] {
    background: var(--bg-raised);
    color: var(--text);
    box-shadow:
      0 0 0 1px var(--border),
      0 1px 2px oklch(0 0 0 / 0.08);
  }
  .seg input {
    position: absolute;
    inset: 0;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }
  .seg:has(input:focus-visible) {
    outline: 2px solid var(--ring);
    outline-offset: 1px;
  }
  .state-actions {
    display: flex;
    gap: 8px;
  }
</style>
