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

<div>
  <table>
    <thead>
      {#if !newRow}
        <tr>
          <td colSpan={columns.length + 1 + (relations.length > 0 ? 1 : 0)}>
            <div style="display: flex; justify-content: space-between;">
              <span>
                <b>{repo.metadata.caption}</b>

                <button
                  on:click={() => {
                    newRow = repo.create({ ...parentRelation })
                  }}>+</button
                >
              </span>
              <Filter fields={columns} bind:filter={$filter} />
              <span>
                <button
                  disabled={(options.page || 1) === 1}
                  on:click={() => {
                    options = { ...options, page: (options.page || 2) - 1 }
                  }}
                >
                  &lt;
                </button>

                {from + ' - ' + to} of {totalRows}

                <button
                  disabled={to >= totalRows}
                  on:click={() => {
                    options = { ...options, page: (options.page || 1) + 1 }
                  }}
                >
                  &gt;
                </button>
              </span>
            </div>
          </td>
        </tr>
      {:else}
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
    </tbody>
  </table>
</div>
