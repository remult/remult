<script lang="ts">
  import { tick } from 'svelte'
  import type { EntityFilter } from '../../../../core/index.js'
  import type { EntityRelationToManyInfo } from '../../../../core/server/remult-admin'
  import { Filter } from '../../../../core/src/filter/filter-interfaces.js'
  import { god, type TableInfo } from '../core/god.svelte.js'
  import { settings } from '../core/settings.svelte.js'
  import Table from './Table.svelte'

  let {
    relations,
    values,
    label,
  }: {
    relations: EntityRelationToManyInfo[]
    /** The parent row's saved values. */
    values: Record<string, unknown>
    /** Names the tab list, like the parent row. */
    label: string
  } = $props()

  // hidden entities still answer here: look in every table, not only the visible ones
  const targets = $derived(
    relations.map((rel) => ({ rel, table: god.tables.find((t) => t.key === rel.entityKey) })),
  )
  // svelte-ignore state_referenced_locally
  let tab = $state(relations[0]?.key ?? '')

  function whereFor(rel: EntityRelationToManyInfo, t: TableInfo): EntityFilter<any> {
    const own = Object.fromEntries(Object.entries(rel.fields).map(([k, v]) => [k, values[v]]))
    const extra = rel.where ? Filter.entityFilterFromJson(t.repo.metadata, rel.where) : {}
    // the relation's own keys win: a child row always belongs to this parent
    return { ...extra, ...own }
  }

  const name = (x: { caption: string; key: string }) => (settings.displayCaption ? x.caption : x.key)

  const uid = $props.id()
  const current = $derived(targets.find((x) => x.rel.key === tab) ?? targets[0])
  let list: HTMLElement | undefined = $state()

  // a hand rolled tab list: the ui-sdk one costs more bytes than this panel is worth
  async function onkeydown(e: KeyboardEvent) {
    const i = targets.findIndex((x) => x.rel.key === current?.rel.key)
    const last = targets.length - 1
    const next =
      e.key === 'ArrowRight' ? (i === last ? 0 : i + 1)
      : e.key === 'ArrowLeft' ? (i === 0 ? last : i - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : undefined
    if (next === undefined) return
    e.preventDefault()
    tab = targets[next].rel.key
    await tick()
    list?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus()
  }
</script>

<div class="relations">
  <div class="rel-tabs" role="tablist" aria-label={`Related to ${label}`} tabindex="-1" bind:this={list} {onkeydown}>
    {#each targets as { rel, table } (rel.key)}
      {@const selected = rel.key === current?.rel.key}
      <button
        class="rel-tab"
        type="button"
        role="tab"
        id={`${uid}-${rel.key}`}
        aria-selected={selected}
        aria-controls={`${uid}-panel`}
        tabindex={selected ? 0 : -1}
        style:--hue={table?.color ?? 262}
        onclick={() => (tab = rel.key)}
      >
        <span class="hue-dot"></span>
        {name(rel)}
      </button>
    {/each}
  </div>
  {#if current}
    <div class="rel-panel" role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-${current.rel.key}`}>
      {#if current.table}
        {#key current}
          <Table table={current.table} parentWhere={whereFor(current.rel, current.table)} />
        {/key}
      {:else}
        <p class="missing">{name(current.rel)} is not available to you.</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .relations {
    padding: 4px 12px 12px 36px;
    background: var(--bg-inset);
    box-shadow: inset 0 1px 0 var(--border);
  }
  .rel-tabs {
    display: flex;
    gap: 2px;
    margin-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }
  .rel-tab {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    height: 32px;
    padding: 0 10px;
    border: 0;
    border-radius: var(--radius) var(--radius) 0 0;
    background: transparent;
    color: var(--text-muted);
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
    transition: color 120ms var(--ease-out);
  }
  .rel-tab::after {
    content: '';
    position: absolute;
    inset: auto 8px -1px;
    height: 2px;
    border-radius: 2px 2px 0 0;
    background: oklch(var(--hue-l) var(--hue-c) var(--hue));
    opacity: 0;
    scale: 0.6 1;
    transition-property: opacity, scale;
    transition-duration: 160ms;
    transition-timing-function: var(--ease-out);
  }
  .rel-tab:hover {
    color: var(--text);
  }
  .rel-tab[aria-selected='true'] {
    color: var(--text);
  }
  .rel-tab[aria-selected='true']::after {
    opacity: 1;
    scale: 1;
  }
  .rel-tab:focus-visible {
    outline-offset: -2px;
  }
  .rel-panel {
    overflow: hidden;
    border-radius: var(--radius-lg);
    background: var(--bg);
    box-shadow:
      0 0 0 1px var(--border),
      0 1px 2px oklch(0 0 0 / 0.04);
  }
  .missing {
    margin: 0;
    padding: 16px;
    color: var(--text-muted);
  }
</style>
