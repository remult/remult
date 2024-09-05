<script lang="ts">
  import type {
    EntityRelationToManyInfo,
    FieldUIInfo,
  } from '../../../../core/server/remult-admin'

  import { godStore } from '../../stores/GodStore'
  import Cancel from '../icons/Cancel.svelte'
  import Delete from '../icons/Delete.svelte'
  import Save from '../icons/Save.svelte'
  import { LSContext } from '../stores/LSContext.js'
  import EditableField from './EditableField.svelte'
  import Table from './Table.svelte'

  export let row: any
  export let saveAction: (data: any) => Promise<void>
  export let deleteAction: () => Promise<void> = () => Promise.resolve()
  export let cancelAction: () => Promise<void> = () => Promise.resolve()
  export let columns: FieldUIInfo[]
  export let relations: EntityRelationToManyInfo[]
  export let rowId: any
  const rmvWarning = rowId
  export let isNewRow = false

  let error = undefined
  let relation: EntityRelationToManyInfo | null = null

  let rowFrozzen = { ...row }

  $: value = row
  $: relationTable =
    relation &&
    typeof relation === 'object' &&
    $godStore.tables.find((x) => x.key === relation.entityKey)
  $: change =
    Boolean(columns.find((x) => value[x.key] !== rowFrozzen[x.key])) || isNewRow

  $: relationWhere =
    row && relation && typeof relation === 'object'
      ? Object.fromEntries(
          Object.entries(relation.fields).map(([key, value]) => [
            key,
            row[value],
          ]),
        )
      : {}

  async function doSave() {
    try {
      error = undefined
      await saveAction(value)
      rowFrozzen = { ...value }
    } catch (err: any) {
      alert(err.message)
      error = err
    }
  }

  function changeOrNew(_change: boolean, _isNewRow: boolean) {
    return _change || _isNewRow
  }
</script>

<tr class={changeOrNew(change, isNewRow) ? 'change' : ''}>
  <td>
    {#if relations.length > 0 && !isNewRow}
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
    {/if}
  </td>
  {#each columns as x}
    <td class:changeHi={value[x.key] !== rowFrozzen[x.key]}>
      <EditableField
        {isNewRow}
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
  <td class="action-tab {changeOrNew(change, isNewRow) ? 'change' : ''}">
    <div class="row-actions">
      {#if changeOrNew(change, isNewRow)}
        <div class="margin-auto">
          <button class="icon-button" title="Save" on:click={doSave}>
            <Save></Save>
          </button>
          <button
            class="icon-button"
            title="Cancel"
            on:click={async () => {
              value = rowFrozzen
              error = undefined
              cancelAction()
            }}
          >
            <Cancel></Cancel>
          </button>
        </div>
      {/if}
      {#if deleteAction && !changeOrNew(change, isNewRow)}
        <button
          class="icon-button margin-auto"
          title="Delete"
          on:click={async () => {
            try {
              if ($LSContext.settings.confirmDelete) {
                const res = confirm(
                  'Are you sure you want to delete this line ?',
                )
                if (res) {
                  await deleteAction()
                }
              } else {
                await deleteAction()
              }
            } catch (err) {
              alert(err.message)
            }
          }}
        >
          <Delete></Delete>
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
              )?.color}"
              on:click={(e) => {
                relation = r
                e.preventDefault()
              }}
            >
              {$godStore.tables.find((x) => x.key === r.entityKey)?.caption}
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
    border-bottom: 2px solid hsla(var(--color), 70%, 50%, 1);
  }

  .margin-auto {
    margin-left: auto;
    margin-right: auto;
  }

  .change {
    background-color: hsl(137, 90%, 93%) !important;
  }
  .changeHi {
    background-color: hsl(137, 90%, 86%) !important;
  }
</style>
