<script lang="ts">
  import type {
    Repository,
    FindOptions,
  } from '../../../core/src/remult3/remult3'
  import type {
    EntityRelationToManyInfo,
    EntityUIInfo,
    FieldUIInfo,
  } from '../../../core/server/remult-admin'
  import { onDestroy, onMount } from 'svelte'
  import EditableRow from './EditableRow.svelte'
  import { God } from '../God'

  export let columns: FieldUIInfo[]
  export let relations: EntityRelationToManyInfo[]
  export let repo: Repository<any>
  export let god: God
  export let parentRelation: Record<string, any> = {}

  let options: FindOptions<any> = {}

  let items = []
  let unSub: (() => void) | null = null

  onMount(() => {
    repo
      .liveQuery({
        // ...options,
        // where: {
        //   $and: [userFilter, { ...parentRelation }],
        // },
      })
      .subscribe((info) => {
        items = info.applyChanges(items)
        console.log(`ddd`, items)
      })
  })
  onDestroy(() => {
    unSub && unSub()
  })

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
      <tr>
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
        <th>Actions </th>
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
          {god}
        />
      {/each}
    </tbody>
  </table>
</div>
