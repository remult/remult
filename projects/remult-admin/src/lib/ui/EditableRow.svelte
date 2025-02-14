<script lang="ts">
  import { run } from 'svelte/legacy'

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

  interface Props {
    row: any
    relationsToOneValues?: RelationsToOneValues
    saveAction: (data: any) => Promise<void>
    deleteAction?: () => Promise<void>
    cancelAction?: () => Promise<void>
    columns: FieldUIInfo[]
    relations: EntityRelationToManyInfo[]
    rowId: any
    isNewRow?: boolean
  }

  let {
    row,
    relationsToOneValues = {},
    saveAction,
    deleteAction = () => Promise.resolve(),
    cancelAction = () => Promise.resolve(),
    columns,
    relations,
    rowId,
    isNewRow = false,
  }: Props = $props()

  let error = $state(undefined)
  let currentRelation: EntityRelationToManyInfo | null = $state(null)
  let isFocused = false

  let rowFrozzen = $state({ ...row })

  let value = $state()
  run(() => {
    value = row
  })

  let relationTable = $derived(
    currentRelation &&
      typeof currentRelation === 'object' &&
      $godStore.tables.find((x) => x.key === currentRelation.entityKey),
  )

  let change = $derived(
    Boolean(
      columns.find(
        // TODO check also for json diff? (today, when filtering or ordering, it will be considered a change "sometimes"... false positive!)
        // x.type !== 'json' &&
        (x) => x.type !== 'json' && value[x.key] !== rowFrozzen[x.key],
      ),
    ) || isNewRow,
  )

  let relationWhere = $derived(
    row && currentRelation && typeof currentRelation === 'object'
      ? {
          ...Object.fromEntries(
            Object.entries(currentRelation.fields).map(([key, value]) => [
              key,
              row[value],
            ]),
          ),
          ...currentRelation.where,
        }
      : {},
  )

  async function doSave() {
    try {
      error = undefined
      await saveAction(value)
      rowFrozzen = { ...value }
    } catch (err: any) {
      error = err
    }
  }

  async function doCancel() {
    value = rowFrozzen
    error = undefined
    await cancelAction()
  }

  function changeOrNew(_change: boolean, _isNewRow: boolean) {
    return _change || _isNewRow
  }

  function handleKeydown(e: KeyboardEvent) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const modifier = isMac ? e.metaKey : e.ctrlKey

    // Handle global actions (with shift) or focused row actions
    if (changeOrNew(change, isNewRow)) {
      if (e.key === 'Enter' && modifier) {
        e.preventDefault()
        if (e.shiftKey) {
          // Save all changes
          const allEditableRows = document.querySelectorAll('tr')
          allEditableRows.forEach((row) => {
            const saveBtn = row.querySelector(
              '.save-button',
            ) as HTMLButtonElement
            if (saveBtn) {
              saveBtn.click()
            }
          })
        } else if (isFocused) {
          // Save only focused row
          doSave()
        }
      } else if (e.key === 'Escape' && modifier) {
        e.preventDefault()
        if (e.shiftKey) {
          // Cancel all changes
          const allEditableRows = document.querySelectorAll('tr')
          allEditableRows.forEach((row) => {
            const cancelBtn = row.querySelector(
              '.cancel-button',
            ) as HTMLButtonElement
            if (cancelBtn) {
              cancelBtn.click()
            }
          })
        } else if (isFocused) {
          // Cancel only focused row
          doCancel()
        }
      }
    }
  }

  function handleFocusIn() {
    isFocused = true
  }

  function handleFocusOut(e: FocusEvent) {
    // Check if the new focus target is still within this row
    const row = (e.target as HTMLElement).closest('tr')
    const newTarget = (e.relatedTarget as HTMLElement)?.closest('tr')
    if (row !== newTarget) {
      isFocused = false
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<tr
  class={changeOrNew(change, isNewRow) ? 'change' : ''}
  onfocusin={handleFocusIn}
  onfocusout={handleFocusOut}
>
  <td>
    {#if relations.length > 0 && !isNewRow}
      <button
        class="icon-button relations-button"
        title="Relations"
        onclick={() =>
          (currentRelation = currentRelation ? null : relations[0])}
        class:open={currentRelation}
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
          <button
            class="icon-button save-button"
            title="Save (⌘/Ctrl+Enter, ⌘/Ctrl+Shift+Enter for all)"
            onclick={doSave}
          >
            <Save></Save>
          </button>
          <button
            class="icon-button cancel-button"
            title="Cancel (⌘/Ctrl+Esc, ⌘/Ctrl+Shift+Esc for all)"
            onclick={doCancel}
          >
            <Cancel></Cancel>
          </button>
        </div>
      {/if}
      {#if deleteAction && !changeOrNew(change, isNewRow)}
        <button
          class="icon-button delete-button margin-auto"
          title="Delete"
          onclick={async () => {
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
{#if currentRelation}
  <tr class="extended">
    <td></td>
    <td colSpan={columns.length + 2}>
      <div class="extended__holder">
        <div class="extended__links">
          {#each relations as r}
            <button
              class={'tab ' +
                (r === currentRelation ? 'active' : '') +
                ' entityColor'}
              style="--color: {$godStore.tables.find(
                (x) => x.key === r.entityKey,
              )?.color}"
              onclick={(e) => {
                currentRelation = r
                e.preventDefault()
              }}
            >
              {$LSContext.settings.dispayCaption ? r.caption : r.key}
            </button>
          {/each}
        </div>

        {#if relationTable && typeof currentRelation === 'object'}
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
    border-top: 1px solid red;
    border-bottom: 1px solid red;
    position: absolute;
    top: -6px;
    width: 100%;
    font-size: 0.8em;
    color: #d32f2f;
    margin-top: -2px;
    text-align: center;
    /* padding: 0px 4px; */
    background-color: #ffebee;
    border-radius: 2px;
    transition: opacity 0.3s ease-in-out;
    z-index: 77;
  }
</style>
