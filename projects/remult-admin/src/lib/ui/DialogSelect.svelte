<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import { writable } from 'svelte/store'
  import type { FieldRelationToOneInfo } from '../../../../core/server/remult-admin'

  import { godStore } from '../../stores/GodStore.js'

  export let relation: FieldRelationToOneInfo

  export let onSelect: (value) => void

  const items = writable<{ id: any; caption: string }[]>([])
  const count = writable(0)
  const search = writable<string | undefined>('')

  const refresh = async (s: any) => {
    const ret = await $godStore.getItemsForSelect(relation, s)
    $items = ret.items
    $count = ret.$count
  }

  $: relation && refresh($search)

  function handleSubmit(e: Event) {
    e.preventDefault()
    let currentItems
    items.subscribe((value) => (currentItems = value))
    if (currentItems?.length === 1) {
      onSelect(currentItems[0].id)
    }
  }

  function handleSelect(id: any) {
    onSelect(id)
  }
</script>

<form on:submit={handleSubmit}>
  <input bind:value={$search} placeholder="Search" />
</form>

<div class="result-count">
  <span>{$items.length} </span>
  {#if $count > $items.length}
    <span class="total-count">/ {$count}</span>
  {/if}
</div>

<div class="dialog-list">
  {#each $items as item}
    <button on:click={() => handleSelect(item.id)}>
      <span style="width: 100%; text-align: left;">
        {item.caption ?? "Can't display"}
      </span>
    </button>
  {/each}
  <button
    id="unset-button"
    disabled={!relation.allowNull}
    on:click={() => handleSelect(null)}
  >
    <span style="width: 100%; text-align: left;">
      {#if relation.allowNull}
        - Unset -
      {:else}
        Can't unset
      {/if}
    </span>
  </button>
</div>

<!-- </dialog> -->

<style>
  #unset-button {
    color: rgb(var(--color-black) / 0.5);
    margin-top: 1rem;
  }

  #unset-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  :global(body) {
    --primary-color: #007bff;
    --hover-color: #0056b3;
  }
  .result-count {
    text-align: right;
    margin-top: -0.5rem;
    margin-bottom: 0.5rem;
    margin-right: 0.5rem;
    font-size: 0.7rem;
    color: rgb(var(--color-black) / 0.8);
  }

  input {
    width: 100%;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    border: 0.1rem solid rgb(var(--color-black) / 0.5);
  }

  input:focus {
    border-color: var(--primary-color);
    outline: 0;
    box-shadow: 0.2rem rgba(0, 123, 255, 0.25);
  }

  .dialog-list {
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    gap: 0.2rem;
  }

  button:focus {
    box-shadow: 0 0 0 2px rgb(0, 123, 255) inset;
  }
</style>
