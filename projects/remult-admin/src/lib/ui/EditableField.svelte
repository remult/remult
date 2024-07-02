<script lang="ts">
  import type { FieldUIInfo } from '../../../../core/server/remult-admin'
  import RelationField from './RelationField.svelte'
  import { type Content, JSONEditor } from 'svelte-jsoneditor'

  export let value: any
  export let info: FieldUIInfo

  let dialogJSON: HTMLDialogElement | null = null

  const onChange = (content: Content) => {
    // @ts-ignore
    if (JSON.stringify(content.json) != JSON.stringify(value)) {
      // @ts-ignore
      value = content.json
    }
  }
</script>

<!-- TODO Ermin? When readonly? -->
<!-- {info.dbReadOnly} -->
{#if info.relationToOne}
  <RelationField bind:value {info} on:change />
{:else if info.type == 'json'}
  <button
    class="icon-button"
    on:click={() => {
      // showJSON = true
      dialogJSON.showModal()
      // ref.current?.showModal()
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
        d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
      />
    </svg>
  </button>
  <dialog bind:this={dialogJSON} on:close={() => {}} class="dialog-big">
    <button on:click={() => dialogJSON.close()}>Close</button>
    <div class="dialog-content">
      <JSONEditor content={{ json: value ?? {} }} {onChange} />
    </div>
  </dialog>
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
{:else}
  <input bind:value on:change />
{/if}

<style>
  .dialog-big {
    width: 90vw;
    height: 90vh;
  }

  .dialog-content {
    display: flex;
    flex-direction: 'column';
    height: '100%';
  }
</style>
