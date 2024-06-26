<script lang="ts">
  import type {
    Repository,
    FindOptions,
    EntityFilter,
  } from '../../../core/src/remult3/remult3'
  import type {
    EntityRelationToManyInfo,
    FieldUIInfo,
  } from '../../../core/server/remult-admin'
  import { onDestroy } from 'svelte'
  import EditableRow from './EditableRow.svelte'
  import Filter from './Filter.svelte'
  import { writable, type Writable } from 'svelte/store'

  export let columns: FieldUIInfo[]
  export let relations: EntityRelationToManyInfo[]
  export let repo: Repository<any>
  export let parentRelation: Record<string, any> = {}

  let options: FindOptions<any> = { limit: 25, page: 1 }

  let filter: Writable<EntityFilter<any>> = writable({})

  let items = []
  let totalRows = -1
  let unSub: (() => void) | null = null

  const reSub = (currentFilter: EntityFilter<any>) => {
    if (unSub) {
      unSub()
    }

    unSub = repo
      .liveQuery({
        ...options,
        where: {
          $and: [currentFilter, { ...parentRelation }],
        },
      })
      .subscribe(async (info) => {
        items = info.applyChanges(items)
        totalRows = await repo.count({
          $and: [currentFilter, { ...parentRelation }],
        })
        //.then(setTotalRows)
      })
  }

  onDestroy(() => {
    unSub && unSub()
  })

  // trick to make sure reSub is called when repo changes
  $: repo && options && reSub($filter)

  $: from = ((options.page || 1) - 1) * options.limit + 1
  $: to = ((options.page || 1) - 1) * options.limit + (items?.length || 0)

  let newRow = undefined

  const toggleOrderBy = (key: string) => {
    let dir = options.orderBy?.[key]
    if (dir === undefined) dir = 'asc'
    else if (dir === 'asc') dir = 'desc'
    else dir = undefined
    options = { ...options, orderBy: { [key]: dir } }
  }
</script>

<div class="page-bar">
    <button
      class="icon-button"
      on:click={() => {
        const nav = document.querySelector('body')
        nav?.classList.toggle('hide-navigation')
      }}
    >
    <svg class="hamburger-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect y="4.68134" width="24" height="2.03049" fill="black"/><rect y="10.9847" width="24" height="2.03049" fill="black"/><rect y="17.2882" width="24" height="2.03049" fill="black"/></svg>
    </button>

    <div class="page-bar__title">{repo.metadata.caption}</div>

    <div class="page-bar__new-entry">
      <button class="icon-button" on:click={() => { newRow = repo.create({ ...parentRelation })}}>+</button>
    </div>

    <Filter fields={columns} bind:filter={$filter} />

    <span>{from + ' - ' + to} of {totalRows}</span>

    <button class="icon-button" disabled={(options.page || 1) === 1}
      on:click={() => {
        options = { ...options, page: (options.page || 2) - 1 }
    }}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width={1.5} stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
    </button>

    <button class="icon-button" disabled={to >= totalRows}
      on:click={() => {
        options = { ...options, page: (options.page || 1) + 1 }
    }}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width={1.5} stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
    </button>
</div>

<div class="table-container">
  <table>
    <thead>
      <tr>
        {#if relations.length > 0}
          <td />
        {/if}
        {#each columns as column}
          <th on:click={() => toggleOrderBy(column.key)}>
            {column.caption}
            {options.orderBy?.[column.key] === 'asc'
              ? '▲'
              : options.orderBy?.[column.key] === 'desc'
              ? '▼'
              : ''}
          </th>
        {/each}
        <th align="right">Actions</th>
      </tr>
    </thead>
    <tbody>
      {#each items as row}
        <EditableRow
          rowId={repo.metadata.idMetadata.getId(row)}
          {row}
          save={async (item) => {
            await repo.update(row, item)
          }}
          deleteAction={() => repo.delete(row)}
          {columns}
          {relations}
        />
      {/each}
      
      {#if newRow}
        <EditableRow
          rowId={undefined}
          row={newRow}
          {columns}
          {relations}
          deleteAction={async () => {
            newRow = undefined
          }}
          save={async (item) => {
            await repo.insert(item)
            newRow = undefined
          }}
        />
      {/if}
    </tbody>
  </table>
</div>
