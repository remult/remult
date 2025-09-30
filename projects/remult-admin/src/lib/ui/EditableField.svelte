<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type {
    FieldUIInfo,
    RelationsToOneValues,
  } from '../../../../core/server/remult-admin'
  import Json from '../icons/Json.svelte'
  import { dialog } from './dialog/dialog.js'
  import RelationField from './RelationField.svelte'
  import { type Content, JSONEditor } from 'svelte-jsoneditor'
  import { onMount } from 'svelte'
  import TextEditor from './TextEditor.svelte'

  export let value: any | undefined = undefined
  export let relationsToOneValues: RelationsToOneValues = {}
  export let info: FieldUIInfo
  export let isNewRow = false

  const dispatch = createEventDispatcher()

  let inputElement: HTMLInputElement
  let isOverflowing = false

  function checkOverflow() {
    if (inputElement) {
      isOverflowing = inputElement.scrollWidth > inputElement.clientWidth + 2
    }
  }

  onMount(() => {
    checkOverflow()
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  })

  $: if (value !== undefined) {
    setTimeout(checkOverflow, 0)
  }

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
{:else if isNewRow && info.readOnly}
  <input
    value=""
    disabled
    style="opacity: 0.5; background-color: Gainsboro; cursor: not-allowed;"
    on:keydown={handleKeydown}
  />
{:else if info.readOnly}
  <input
    bind:value
    disabled
    style="opacity: 0.5; cursor: not-allowed;"
    on:keydown={handleKeydown}
  />
{:else if info.type == 'json'}
  <button
    style="margin-left: auto; margin-right: auto; width: 100%"
    class="icon-button"
    on:click={() => {
      dialog.show({
        config: { title: 'Edit JSON', width: '90vw' },
        component: JSONEditor,
        props: { content: { json: value }, onChange },
      })
    }}
    on:keydown={handleKeydown}
  >
    <Json></Json>
  </button>
{:else if info.type == 'boolean'}
  <select bind:value on:keydown={handleKeydown}>
    <option value={false}>False</option>
    <option value={true}>True</option>
  </select>
{:else if info.values && info.values.length > 0}
  <select bind:value on:keydown={handleKeydown}>
    {#each info.values as option}
      {#if typeof option == 'object'}
        <option value={String(option.id)}>{option.caption}</option>
      {:else}
        <option value={String(option)}>{option}</option>
      {/if}
    {/each}
  </select>
{:else if info.type == 'number'}
  <input
    bind:value
    on:change
    type="number"
    style="text-align: right;"
    on:keydown={handleKeydown}
  />
{:else if info.inputType == 'color'}
  <input bind:value on:change type="color" on:keydown={handleKeydown} />
{:else if info.inputType == 'date'}
  <input
    bind:value
    on:change
    type="date"
    style="text-align: center; width: 100%;"
    on:keydown={handleKeydown}
  />
{:else}
  <span>
    <input
      bind:this={inputElement}
      bind:value
      on:change
      type="text"
      on:keydown={handleKeydown}
      on:input={checkOverflow}
    />
    {#if info.allowNull}
      <button disabled={value === null} on:click={() => (value = null)}>
        x
      </button>
    {/if}
    {#if isOverflowing && value && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)}
      <button
        on:click={async () => {
          const res = await dialog.show({
            config: { title: 'Edit Text', width: '50vw' },
            component: TextEditor,
            props: {
              text: value,
            },
          })
          if (res.success) {
            value = res.data
            dispatch('change', { value })
          }
        }}>...</button
      >
    {/if}
  </span>
{/if}

<style>
  span {
    display: flex;
    align-items: stretch;
    gap: 1px;
    width: 100%;
    height: 100%;
  }

  span input {
    flex: 1;
    min-width: 0;
    height: 100%;
    margin: 0;
    padding: 0 4px;
    overflow: hidden;
    white-space: nowrap;
  }

  span button {
    border: none;
    background: none;
    padding: 0 4px;
    height: 100%;
    cursor: pointer;
    opacity: 0.5;
    transition:
      opacity 0.2s,
      background-color 0.2s;
    border-radius: 0;
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  span button:hover {
    opacity: 1;
    background-color: rgb(243 244 246);
  }
</style>
