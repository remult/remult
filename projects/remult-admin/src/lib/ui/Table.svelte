<script lang="ts">
  import type {
    Repository,
    FindOptions,
    EntityFilter,
  } from '../../../../core/src/remult3/remult3'
  import type {
    EntityRelationToManyInfo,
    FieldUIInfo,
    RelationsToOneValues,
  } from '../../../../core/server/remult-admin'
  import EditableRow from './EditableRow.svelte'
  import Filter from './Filter.svelte'
  import LoadingSkeleton from './LoadingSkeleton.svelte'
  import { SSContext } from '../stores/SSContext.js'
  import { LSContext } from '../stores/LSContext.js'
  import Key from '../icons/Key.svelte'
  import ColumnType from '../icons/ColumnType.svelte'
  import { dialog } from './dialog/dialog.js'
  import ChevronLeft from '../icons/ChevronLeft.svelte'
  import ChevronRight from '../icons/ChevronRight.svelte'
  import Back from '../icons/Back.svelte'
  import { godStore } from '../../stores/GodStore.js'
  import Asc from '../icons/Asc.svelte'
  import Desc from '../icons/Desc.svelte'

  interface Props {
    fields: FieldUIInfo[]
    relations: EntityRelationToManyInfo[]
    repo: Repository<any>
    parentRelation?: Record<string, any>
    color: string
    defaultOrderBy: EntityFilter<any>
    defaultNumberOfRows?: number
  }

  let {
    fields,
    relations,
    repo,
    parentRelation = {},
    color,
    defaultOrderBy,
    defaultNumberOfRows = 25,
  }: Props = $props()

  let options = $state<FindOptions<any>>({
    limit: $LSContext.settings.numberOfRows,
    page: 1,
    orderBy: defaultOrderBy,
  })

  let filter = $state<EntityFilter<any>>({})
  let items = $state<any[] | null>(null)
  let relationsToOneValues = $state<RelationsToOneValues>({})
  let totalRows = $state(-1)
  let newRow = $state<any>()

  // Effects
  // $effect(() => {
  //   if ($SSContext.forbiddenEntities.includes(repo.metadata.key)) {
  //     items = []
  //   }
  // })

  // $effect(() => {
  //   if (fields) {
  //     items = null
  //     relationsToOneValues = {}
  //     filter = {}
  //   }
  // })

  // $effect(() => {
  //   if (repo && options) {
  //     reSub(filter)
  //   }
  // })

  // onMount(() => {
  //   reSub(filter)
  // })

  $effect(() => {
    const where = { $and: [filter, { ...parentRelation }] }
    if ($LSContext.settings.withLiveQuery) {
      return repo
        .liveQuery({
          ...options,
          where,
        })
        .subscribe(async (info) => {
          let tmpItems = items
          let special = false
          if (items !== null) {
            info.changes.forEach((c) => {
              if (c.type === 'add') {
                special = true
                tmpItems = [c.data.item, ...items]
              }
            })
          }

          if (!special) {
            tmpItems = info.applyChanges(items)
          }

          if (tmpItems && tmpItems.length > 0) {
            await afterMainQuery(tmpItems, where)
          }

          items = tmpItems
        })
    } else {
      manualfind(where)
    }
  })

  const manualfind = (where: EntityFilter<any>) => {
    if (!$LSContext.settings.withLiveQuery) {
      repo
        .find({
          ...options,
          where,
        })
        .then(async (_items) => {
          items = _items
          await afterMainQuery(items, where)
        })
    }
  }

  // Computed values
  let from = $derived(((options.page || 1) - 1) * options.limit + 1)
  let to = $derived(
    ((options.page || 1) - 1) * options.limit + (items?.length || 0),
  )

  const afterMainQuery = async (items: any[], where: EntityFilter<any>) => {
    const promises = fields
      .filter((f) => f.relationToOne)
      .map((f) => $godStore.displayValueForEach(f, items))

    const results = await Promise.all(promises)
    results.forEach((r) => {
      relationsToOneValues = {
        ...relationsToOneValues,
        ...r,
      }
    })

    totalRows = await repo.count(where)
  }

  const toggleOrderBy = (key: string) => {
    let dir = options.orderBy?.[key]
    if (dir === undefined) dir = 'desc'
    else if (dir === 'desc') dir = 'asc'
    else dir = undefined
    options = { ...options, orderBy: { [key]: dir } }
  }

  const getWidth = () => {
    const r = Math.random()
    if (r > 0.6) return 120
    if (r > 0.3) return 100
    return 70
  }

  const filterDialog = async (
    _fields: FieldUIInfo[],
    _filter: EntityFilter<any>,
  ) => {
    const res = await dialog.show({
      config: { title: 'Filter', width: '600px' },
      component: Filter as any, // Type assertion to fix the error
      props: { fields: _fields, filter: _filter },
    })
    if (res.success) {
      filter = res.data
    }
  }
</script>

<div class="page-bar">
  <button
    class="icon-button"
    onclick={() => {
      const nav = document.querySelector('body')
      nav?.classList.toggle('hide-navigation')
    }}
  >
    <Back />
  </button>

  <div class="page-bar__title title" style="--color: {color}">
    {$LSContext.settings.dispayCaption
      ? repo.metadata.caption
      : repo.metadata.key}
    {#if $SSContext.forbiddenEntities.includes(repo.metadata.key)}
      <span style="color: coral; font-size: smaller;">Forbidden</span>
    {/if}
  </div>
  <button onclick={() => filterDialog(fields, filter)}> Filter</button>

  <span class="page-bar__results"
    >{from + ' - ' + to} of
    <b style="font-weight: 600;">{totalRows}</b></span
  >

  <button
    class="icon-button"
    disabled={(options.page || 1) === 1}
    onclick={() => {
      options = { ...options, page: (options.page || 2) - 1 }
    }}
  >
    <ChevronLeft />
  </button>

  <button
    class="icon-button"
    disabled={to >= totalRows}
    onclick={() => {
      options = { ...options, page: (options.page || 1) + 1 }
    }}
  >
    <ChevronRight />
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
              onclick={() => {
                newRow = repo.create({ ...parentRelation })
              }}
            >
              +
            </button>
          {:else}
            <button
              class="icon-button new-entry"
              onclick={() => {
                newRow = undefined
              }}
            >
              -
            </button>
          {/if}
        </td>
        {#each fields as column}
          <th onclick={() => toggleOrderBy(column.key)}>
            <span class="th-span">
              {#if Object.keys(repo.metadata.options.id).includes(column.key)}
                <Key />
              {:else}
                <span></span>
              {/if}
              <span class="flexItemCenter">
                {$LSContext.settings.dispayCaption
                  ? column.caption
                  : column.key}
                {#if options.orderBy?.[column.key] === 'asc'}
                  <Asc />
                {:else if options.orderBy?.[column.key] === 'desc'}
                  <Desc />
                {:else}
                  <span class="w-20"></span>
                {/if}
              </span>
              <ColumnType
                type={column.type}
                isSelect={column.values && column.values.length > 0}
              />
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
          {relationsToOneValues}
          columns={fields}
          {relations}
          saveAction={async (item) => {
            await repo.insert(item)
            newRow = undefined
            manualfind(filter)
          }}
          deleteAction={async () => {
            newRow = undefined
            manualfind(filter)
          }}
          cancelAction={async () => {
            newRow = undefined
            manualfind(filter)
          }}
        />
      {/if}
      {#if items}
        {#each items as row, i (repo.metadata.idMetadata.getId(row))}
          <EditableRow
            rowId={repo.metadata.idMetadata.getId(row)}
            {row}
            {relationsToOneValues}
            saveAction={async (item) => {
              await repo.update(row, item)
              manualfind(filter)
            }}
            deleteAction={async () => {
              await repo.delete(row)
              manualfind(filter)
            }}
            columns={fields}
            {relations}
          />
        {/each}
      {:else}
        {#each Array.from( { length: defaultNumberOfRows }, ).map((_, i) => i) as i}
          <tr>
            <td></td>
            {#each fields as column}
              <td
                class="loading-skeleton"
                onclick={() => toggleOrderBy(column.key)}
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
  .w-20 {
    width: 20px;
  }

  .flexItemCenter {
    display: flex;
    align-items: center;
  }

  th {
    cursor: pointer;
  }

  .th-span {
    display: flex;
    gap: 0.3rem;
    align-items: center;
    justify-content: space-between;
  }

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
