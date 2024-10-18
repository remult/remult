<script lang="ts">
  import type {
    EntityRelationToManyInfo,
    FieldUIInfo,
    RelationsToOneValues,
  } from '../../../../core/server/remult-admin'

  import { godStore } from '../../stores/GodStore'
  import Cancel from '../icons/Cancel.svelte'
  import ChevronRight from '../icons/ChevronRight.svelte'
  import Delete from '../icons/Delete.svelte'
  import Save from '../icons/Save.svelte'
  import { LSContext } from '../stores/LSContext.js'
  import { dialog } from './dialog/dialog.js'
  import EditableField from './EditableField.svelte'
  import Table from './Table.svelte'

  export let row: any
  export let relationsToOneValues: RelationsToOneValues = {}
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
    Boolean(
      columns.find(
        // TODO check also for json diff? (today, when filtering or ordering, it will be considered a change "sometimes"... false positive!)
        // x.type !== 'json' &&
        (x) => x.type !== 'json' && value[x.key] !== rowFrozzen[x.key],
      ),
    ) || isNewRow

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
        <ChevronRight></ChevronRight>
      </button>
    {/if}
  </td>
  {#each columns as x}
    <td
      class:changeHi={x.type !== 'json' && value[x.key] !== rowFrozzen[x.key]}
      style="position: relative"
    >
      <EditableField
        {isNewRow}
        info={x}
        {relationsToOneValues}
        bind:value={value[x.valFieldKey]}
        on:change={() => {
          if (error?.modelState?.[x.valFieldKey])
            error = {
              ...error,
              modelState: {
                ...error.modelState,
                [x.valFieldKey]: undefined,
              },
            }
        }}
      />
      {#if error?.modelState?.[x.valFieldKey]}
        <span class="error-label">
          {error.modelState[x.valFieldKey]}
        </span>
      {/if}
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
                const res = await dialog.confirmDelete('The full line ?')
                if (res.success) {
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
            defaultOrderBy={relationTable.defaultOrderBy}
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

  .error-label {
    position: absolute;
    bottom: -8px;
    width: 100%;
    font-size: 0.8em;
    color: #d32f2f;
    margin-top: -2px;
    text-align: center;
    /* padding: 0px 4px; */
    background-color: #ffebee;
    border-radius: 2px;
    transition: opacity 0.3s ease-in-out;
  }
</style>
