<script lang="ts">
  import type {
    EntityRelationToManyInfo,
    EntityUIInfo,
    FieldUIInfo,
  } from '../../../core/server/remult-admin'

  import { God } from '../God'
  import { godStore } from '../stores/GodStore'
  import EditableField from './EditableField.svelte'
  import Table from './Table.svelte'

  export let row: any
  export let save: (data: any) => Promise<void>
  export let deleteAction: () => Promise<void> = () => Promise.resolve()
  export let columns: FieldUIInfo[]
  export let relations: EntityRelationToManyInfo[]
  export let rowId: any
  // TODO TO REMOVE
  const tmpRmvWarning = rowId

  let error = undefined
  let relation: false | EntityRelationToManyInfo = false

  let rowFrozzen = { ...row }
  $: value = row
  $: relationTable =
    relation &&
    typeof relation === 'object' &&
    $godStore.tables.find((x) => {
      return relation ? x.key === relation.entityKey : false
    })
  $: change = Boolean(columns.find((x) => value[x.key] !== rowFrozzen[x.key]))

  const relationWhere = {}
  //   useMemo(() => {
  //   const result: any = {}
  //   if (typeof relation === 'object')
  //     for (const key in relation.fields) {
  //       if (Object.prototype.hasOwnProperty.call(relation.fields, key)) {
  //         const element = relation.fields[key]
  //         result[key] = row[element]
  //       }
  //     }
  //   return result
  // }, [relation, row])

  async function doSave() {
    try {
      error = undefined
      await save(value)
      rowFrozzen = { ...value }
    } catch (err: any) {
      alert(err.message)
      error = err
    }
  }
</script>

<tr>
  {#if relations.length > 0}
    <td>
      <button
        title="Relations"
        on:click={() => (relation = relation ? false : relations[0])}
      >
        {#if relation}
          &or;
        {:else}
          &gt;
        {/if}
      </button>
    </td>
  {/if}
  {#each columns as x}
    <td>
      <EditableField
        info={x}
        bind:value={value[x.valFieldKey]}
        on:change={(fieldValue) => {
          // setValue({ ...value, [x.valFieldKey]: fieldValue })
          // if (error?.modelState?.[x.valFieldKey])
          //   setError({
          //     ...error,
          //     modelState: {
          //       ...error.modelState,
          //       [x.valFieldKey]: undefined,
          //     },
          //   })
        }}
      />

      <!-- {error?.modelState?.[x.key] && (
        <div style={{ fontSize: 'small', color: 'red' }}>
          {error?.modelState?.[x.valFieldKey]}
        </div>
      )} -->
    </td>
  {/each}
  <td align="right" width="90px">
    {#if change}
      <button class="icon-button" title="Save" on:click={doSave}> S </button>
      <button
        class="icon-button"
        title="Cancel"
        on:click={() => {
          value = rowFrozzen
          error = undefined
        }}
      >
        C
      </button>
    {/if}
    {#if deleteAction}
      <button
        class="icon-button"
        title="Delete"
        on:click={async () => {
          try {
            await deleteAction()
          } catch (err) {
            alert(err.message)
          }
        }}
      >
        D
      </button>
    {/if}
  </td>
</tr>
{#if relation}
  <tr>
    <td></td>
    <td colSpan={columns.length + 1}>
      {#each relations as r}
        <button
          on:click={(e) => {
            relation = r
          }}
        >
          {$godStore.tables.find((x) => x.key === r.entityKey).caption}
        </button>
      {/each}

      {#if relationTable && typeof relation === 'object'}
        <Table
          columns={relationTable.fields}
          relations={relationTable.relations}
          repo={relationTable.repo}
          parentRelation={relationWhere}
        />
      {/if}
    </td>
  </tr>
{/if}
