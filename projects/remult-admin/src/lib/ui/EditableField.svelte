<script lang="ts">
  import { run, createBubbler } from 'svelte/legacy'

  const bubble = createBubbler()
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

  interface Props {
    value?: any | undefined
    relationsToOneValues?: RelationsToOneValues
    info: FieldUIInfo
    isNewRow?: boolean
  }

  let {
    value = $bindable(undefined),
    relationsToOneValues = {},
    info,
    isNewRow = false,
  }: Props = $props()

  const dispatch = createEventDispatcher()

  let inputElement: HTMLInputElement = $state()
  let isOverflowing = $state(false)

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

  run(() => {
    if (value !== undefined) {
      setTimeout(checkOverflow, 0)
    }
  })

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
  <input value="" disabled class="read-only" onkeydown={handleKeydown} />
{:else if info.readOnly}
  <input bind:value disabled class="read-only" onkeydown={handleKeydown} />
{:else if info.type == 'json'}
  <button
    class="icon-button input-json"
    onclick={() => {
      dialog.show({
        config: { title: 'Edit JSON', width: '90vw' },
        // @ts-ignore
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
  <input
    bind:value
    onchange={bubble('change')}
    type="number"
    onkeydown={handleKeydown}
  />
{:else if info.inputType == 'color'}
  <input
    bind:value
    onchange={bubble('change')}
    type="color"
    onkeydown={handleKeydown}
  />
{:else if info.inputType == 'date'}
  <input
    bind:value
    onchange={bubble('change')}
    type="date"
    onkeydown={handleKeydown}
  />
{:else}
  <span>
    <input
      bind:this={inputElement}
      bind:value
      onchange={bubble('change')}
      type="text"
      onkeydown={handleKeydown}
      oninput={checkOverflow}
    />
    {#if isOverflowing && value && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)}
      <button
        onclick={async () => {
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
  .input-json {
    margin-left: auto;
    margin-right: auto;
    width: 100%;
  }
  input[type='number'] {
    text-align: right;
  }

  input[type='date'] {
    text-align: center;
  }

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

  .read-only {
    opacity: 0.5;
    background-color: Gainsboro;
    cursor: not-allowed;
  }
</style>
