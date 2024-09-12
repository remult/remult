<script lang="ts">
  import type {
    Repository,
    FindOptions,
    EntityFilter,
  } from '../../../../core/src/remult3/remult3'
  import type {
    EntityRelationToManyInfo,
    FieldUIInfo,
  } from '../../../../core/server/remult-admin'
  import { onDestroy } from 'svelte'
  import EditableRow from './EditableRow.svelte'
  import Filter from './Filter.svelte'
  import { writable, type Writable } from 'svelte/store'
  import LoadingSkeleton from './LoadingSkeleton.svelte'
  import { SSContext } from '../stores/SSContext.js'
  import { LSContext } from '../stores/LSContext.js'
  import Key from '../icons/Key.svelte'
  import ColumnType from '../icons/ColumnType.svelte'
  import { dialog } from './dialog/dialog.js'

  export let fields: FieldUIInfo[]
  export let relations: EntityRelationToManyInfo[]
  export let repo: Repository<any>
  export let parentRelation: Record<string, any> = {}
  export let color: string

  let options: FindOptions<any>
  // Reset to page 1 on key change
  $: options = repo.metadata.key && { limit: 25, page: 1 }

  let filter: Writable<EntityFilter<any>> = writable({})

  let items: any[] | null = null

  $: $SSContext.forbiddenEntities.includes(repo.metadata.key) && (items = [])

  // resting items when fields change
  $: items = fields && (items = null)

  let totalRows = -1
  let unSub: (() => void) | null = null

  const reSub = (currentFilter: EntityFilter<any>) => {
    $SSContext.forbiddenEntities = []

    if (unSub) {
      unSub()
    }

    const where = { $and: [currentFilter, { ...parentRelation }] }

    unSub = repo
      .liveQuery({
        ...options,
        where,
      })
      .subscribe(async (info) => {
        let special = false
        if (items !== null) {
          info.changes.forEach((c) => {
            if (c.type === 'add') {
              special = true
              items = [c.data.item, ...items]
            }
          })
        }

        if (!special) {
          items = info.applyChanges(items)
        }

        totalRows = await repo.count(where)
      })
  }

  onDestroy(() => {
    unSub && unSub()
  })

  // trick to make sure reSub is called when repo changes
  $: repo && options && reSub($filter)

  $: from = ((options.page || 1) - 1) * options.limit + 1
  $: to = ((options.page || 1) - 1) * options.limit + (items?.length || 0)

  // Reset newRow when items change
  $: newRow = items && undefined

  const toggleOrderBy = (key: string) => {
    let dir = options.orderBy?.[key]
    if (dir === undefined) dir = 'asc'
    else if (dir === 'asc') dir = 'desc'
    else dir = undefined
    options = { ...options, orderBy: { [key]: dir } }
  }

  const getWidth = () => {
    const r = Math.random()

    if (r > 0.6) {
      return 120
    }
    if (r > 0.3) {
      return 100
    }
    return 70
  }

  const filterDialog = async (
    _fields: FieldUIInfo[],
    _filter: EntityFilter<any>,
  ) => {
    const res = await dialog.show<EntityFilter<any>>({
      config: { title: 'Filter' },
      component: Filter,
      props: { fields: _fields, filter: _filter },
    })
    if (res.success) {
      $filter = res.data
    }
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
    <svg
      class="hamburger-icon"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ><rect y="4.68134" width="24" height="2.03049" fill="black" /><rect
        y="10.9847"
        width="24"
        height="2.03049"
        fill="black"
      /><rect y="17.2882" width="24" height="2.03049" fill="black" /></svg
    >
  </button>

  <div class="page-bar__title title" style="--color: {color}">
    {$LSContext.settings.dispayCaption
      ? repo.metadata.caption
      : repo.metadata.key}
    {#if $SSContext.forbiddenEntities.includes(repo.metadata.key)}
      <span style="color: coral; font-size: smaller;">Forbidden</span>
    {/if}
  </div>
  <button on:click={() => filterDialog(fields, $filter)}> Filter</button>

  <span class="page-bar__results">{from + ' - ' + to} of {totalRows}</span>

  <button
    class="icon-button"
    disabled={(options.page || 1) === 1}
    on:click={() => {
      options = { ...options, page: (options.page || 2) - 1 }
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width={1.5}
      stroke="currentColor"
      class="w-6 h-6"
      ><path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M15.75 19.5 8.25 12l7.5-7.5"
      /></svg
    >
  </button>

  <button
    class="icon-button"
    disabled={to >= totalRows}
    on:click={() => {
      options = { ...options, page: (options.page || 1) + 1 }
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width={1.5}
      stroke="currentColor"
      class="w-6 h-6"
      ><path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="m8.25 4.5 7.5 7.5-7.5 7.5"
      /></svg
    >
  </button>
</div>

<div class="table-container">
  <table>
    <thead>
      <tr>
        <td>
          {#if newRow === undefined}
            <button
              class="icon-button new-entry"
              on:click={() => {
                newRow = repo.create({ ...parentRelation })
              }}
            >
              +
            </button>
          {:else}
            <button
              class="icon-button new-entry"
              on:click={() => {
                newRow = undefined
              }}
            >
              -
            </button>
          {/if}
        </td>
        {#each fields as column}
          <th
            on:click={() => toggleOrderBy(column.key)}
            style="cursor: pointer;"
          >
            <span
              style="display: flex; gap:0.3rem; align-items: center; justify-content: space-between;"
            >
              {#if Object.keys(repo.metadata.options.id).includes(column.key)}
                <Key></Key>
              {:else}
                <span></span>
              {/if}
              {$LSContext.settings.dispayCaption ? column.caption : column.key}
              {options.orderBy?.[column.key] === 'asc'
                ? '▲'
                : options.orderBy?.[column.key] === 'desc'
                ? '▼'
                : ''}
              <ColumnType
                type={column.type}
                isSelect={column.values && column.values.length > 0}
              ></ColumnType>
            </span>
          </th>
        {/each}
        <th class="action-tab">Actions</th>
      </tr>
    </thead>
    <tbody>
      {#if newRow}
        <EditableRow
          isNewRow
          rowId={undefined}
          row={newRow}
          columns={fields}
          {relations}
          saveAction={async (item) => {
            await repo.insert(item)
            newRow = undefined
          }}
          deleteAction={async () => {
            newRow = undefined
          }}
          cancelAction={async () => {
            newRow = undefined
          }}
        />
      {/if}
      {#if items}
        {#each items as row, i (repo.metadata.idMetadata.getId(row))}
          <EditableRow
            rowId={repo.metadata.idMetadata.getId(row)}
            {row}
            saveAction={async (item) => {
              await repo.update(row, item)
            }}
            deleteAction={() => repo.delete(row)}
            columns={fields}
            {relations}
          />
        {/each}
      {:else}
        {#each Array.from({ length: 25 }).map((_, i) => i) as i}
          <tr>
            <td></td>
            {#each fields as column}
              <td
                class="loading-skeleton"
                on:click={() => toggleOrderBy(column.key)}
              >
                <LoadingSkeleton width={getWidth()} />
              </td>
            {/each}
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<style>
  .title {
    border-left: 2px solid hsla(var(--color), 70%, 50%, 1);
  }

  .loading-skeleton {
    padding: 0 0.5rem;
  }

  button:disabled {
    opacity: 0.2;
    cursor: not-allowed;
  }
</style>
