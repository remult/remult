<script lang="ts">
  import { createBubbler } from 'svelte/legacy';

  const bubble = createBubbler();
  import { createEventDispatcher } from 'svelte'
  import type {
    FieldUIInfo,
    RelationsToOneValues,
  } from '../../../../core/server/remult-admin'
  import Json from '../icons/Json.svelte'
  import { dialog } from './dialog/dialog.js'
  import RelationField from './RelationField.svelte'
  import { type Content, JSONEditor } from 'svelte-jsoneditor'

  interface Props {
    value: any | undefined;
    relationsToOneValues?: RelationsToOneValues;
    info: FieldUIInfo;
    isNewRow?: boolean;
  }

  let {
    value = $bindable(),
    relationsToOneValues = {},
    info,
    isNewRow = false
  }: Props = $props();

  const dispatch = createEventDispatcher()

  const onChange = (content: Content) => {
    // @ts-ignore
    if (JSON.stringify(content.json) != JSON.stringify(value)) {
      // @ts-ignore
      value = content.json
    }
    dispatch('change', { value })
  }

  const handleKeydown = (e: KeyboardEvent) => {
    const input = e.target as HTMLElement
    const td = input.closest('td')
    if (!td) return

    const tr = td.closest('tr') as HTMLTableRowElement
    if (!tr) return

    const cellIndex = Array.from(tr.cells).indexOf(td)

    if (e.key === 'ArrowDown') {
      const nextRow = tr.nextElementSibling as HTMLTableRowElement
      if (nextRow) {
        const nextCell = nextRow.cells[cellIndex]
        if (nextCell) {
          const nextInput = nextCell.querySelector(
            'input, select',
          ) as HTMLElement
          if (nextInput) {
            e.preventDefault()
            nextInput.focus()
            if (nextInput instanceof HTMLSelectElement) {
              nextInput.click()
            }
          }
        }
      }
    } else if (e.key === 'ArrowUp') {
      const prevRow = tr.previousElementSibling as HTMLTableRowElement
      if (prevRow) {
        const prevCell = prevRow.cells[cellIndex]
        if (prevCell) {
          const prevInput = prevCell.querySelector(
            'input, select',
          ) as HTMLElement
          if (prevInput) {
            e.preventDefault()
            prevInput.focus()
            if (prevInput instanceof HTMLSelectElement) {
              prevInput.click()
            }
          }
        }
      }
    }
  }
</script>

{#if info.relationToOne}
  <RelationField bind:value {info} on:change {relationsToOneValues} />
{:else if (!isNewRow && value === undefined) || (isNewRow && info.readOnly)}
  <input
    value=""
    disabled
    style="opacity: 0.5; background-color: Gainsboro; cursor: not-allowed;"
    onkeydown={handleKeydown}
  />
{:else if info.readOnly}
  <input
    bind:value
    disabled
    style="opacity: 0.5; cursor: not-allowed;"
    onkeydown={handleKeydown}
  />
{:else if info.type == 'json'}
  <button
    style="margin-left: auto; margin-right: auto; width: 100%"
    class="icon-button"
    onclick={() => {
      dialog.show({
        config: { title: 'Edit JSON', width: '90vw' },
        component: JSONEditor,
        props: { content: { json: value ?? {} }, onChange },
      })
    }}
    onkeydown={handleKeydown}
  >
    <Json></Json>
  </button>
{:else if info.type == 'boolean'}
  <select bind:value onkeydown={handleKeydown}>
    <option value={false}>False</option>
    <option value={true}>True</option>
  </select>
{:else if info.values && info.values.length > 0}
  <select bind:value onkeydown={handleKeydown}>
    {#each info.values as option}
      {#if typeof option == 'object'}
        <option value={String(option.id)}>{option.caption}</option>
      {:else}
        <option value={String(option)}>{option}</option>
      {/if}
    {/each}
  </select>
{:else if info.type == 'number'}
  <input bind:value onchange={bubble('change')} type="number" onkeydown={handleKeydown} />
{:else if info.inputType == 'color'}
  <input bind:value onchange={bubble('change')} type="color" onkeydown={handleKeydown} />
{:else}
  <input bind:value onchange={bubble('change')} type="text" onkeydown={handleKeydown} />
{/if}
