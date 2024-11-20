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

  export let value: any | undefined
  export let relationsToOneValues: RelationsToOneValues = {}
  export let info: FieldUIInfo
  export let isNewRow = false

  const dispatch = createEventDispatcher()

  const onChange = (content: Content) => {
    // @ts-ignore
    if (JSON.stringify(content.json) != JSON.stringify(value)) {
      // @ts-ignore
      value = content.json
    }
    dispatch('change', { value })
  }
</script>

{#if info.relationToOne}
  <RelationField bind:value {info} on:change {relationsToOneValues} />
{:else if (!isNewRow && value === undefined) || (isNewRow && info.readOnly)}
  <input
    value=""
    disabled
    style="opacity: 0.5; background-color: Gainsboro; cursor: not-allowed;"
  />
{:else if info.readOnly}
  <input bind:value disabled style="opacity: 0.5; cursor: not-allowed;" />
{:else if info.type == 'json'}
  <button
    style="margin-left: auto; margin-right: auto; width: 100%"
    class="icon-button"
    on:click={() => {
      dialog.show({
        config: { title: 'Edit JSON', width: '90vw' },
        component: JSONEditor,
        props: { content: { json: value ?? {} }, onChange },
      })
    }}
  >
    <Json></Json>
  </button>
{:else if info.type == 'boolean'}
  <select bind:value>
    <option value={false}>False</option>
    <option value={true}>True</option>
  </select>
{:else if info.values && info.values.length > 0}
  <select bind:value>
    {#each info.values as option}
      {#if typeof option == 'object'}
        <option value={String(option.id)}>{option.caption}</option>
      {:else}
        <option value={String(option)}>{option}</option>
      {/if}
    {/each}
  </select>
{:else if info.type == 'number'}
  <input bind:value on:change type="number" />
{:else if info.inputType == 'color'}
  <input bind:value on:change type="color" />
{:else}
  <input bind:value on:change type="text" />
{/if}

<style>
  input[type='number'] {
    text-align: right;
    width: 50px;
  }
</style>
