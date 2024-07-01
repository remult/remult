<script lang="ts">
  import type {
    EntityRelationToManyInfo,
    FieldUIInfo,
  } from '../../../../core/server/remult-admin'

  import { godStore } from '../../stores/GodStore'
  import EditableField from './EditableField.svelte'
  import Table from './Table.svelte'

  export let row: any
  export let save: (data: any) => Promise<void>
  export let deleteAction: () => Promise<void> = () => Promise.resolve()
  export let columns: FieldUIInfo[]
  export let relations: EntityRelationToManyInfo[]
  export let rowId: any
  const rmvWarning = rowId

  let error = undefined
  let relation: EntityRelationToManyInfo | null = null

  let rowFrozzen = { ...row }

  $: value = row
  $: relationTable =
    relation &&
    typeof relation === 'object' &&
    $godStore.tables.find((x) => x.key === relation.entityKey)
  $: change = Boolean(columns.find((x) => value[x.key] !== rowFrozzen[x.key]))

  const relationWhere = {}

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
        class="icon-button"
        title="Relations"
        on:click={() => (relation = relation ? null : relations[0])}
        class:open={relation}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m8.25 4.5 7.5 7.5-7.5 7.5"
          ></path></svg
        >
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
    <div class="row-actions">
      {#if change}
        <button class="icon-button" title="Save" on:click={doSave}>
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
              d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12"
            /></svg
          >
        </button>
        <button
          class="icon-button"
          title="Cancel"
          on:click={() => {
            value = rowFrozzen
            error = undefined
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width={1.5}
            stroke="currentColor"
            class="w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
            /></svg
          >
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width={1.5}
            stroke="currentColor"
            class="w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
            />
          </svg>
        </button>
      {/if}
    </div>
  </td>
</tr>
{#if relation}
  <tr class="extended">
    <td></td>
    <td colSpan={columns.length + 2}>
      <div class="extended__holder">
        <div class="extended__links">
          {#each relations as r}
            <button
              class={'tab ' + (r === relation ? 'active' : '') + ' entityColor'}
              style="--color: {$godStore.tables.find(
                (x) => x.key === r.entityKey,
              ).color}"
              on:click={(e) => {
                relation = r
                e.preventDefault()
              }}
            >
              {$godStore.tables.find((x) => x.key === r.entityKey).caption}
            </button>
          {/each}
        </div>

        {#if relationTable && typeof relation === 'object'}
          <Table
            fields={relationTable.fields}
            relations={relationTable.relations}
            repo={relationTable.repo}
            parentRelation={relationWhere}
            color={relationTable.color}
          />
        {/if}
      </div>
    </td>
  </tr>
{/if}

<style>
  .entityColor {
    border-left: 4px solid hsla(var(--color), 70%, 50%, 1);
  }
</style>
