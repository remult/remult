<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import { writable } from 'svelte/store'
  import type { FieldRelationToOneInfo } from '../../../../core/server/remult-admin'

  import { godStore } from '../../stores/GodStore.js'

  export let relation: FieldRelationToOneInfo

  export let onSelect: (value) => void

  const items = writable<{ id: any; caption: string }[]>([])
  const search = writable<string | undefined>('')

  const refresh = (s: any) => {
    $godStore.getItemsForSelect(relation, s).then((x) => items.set(x))
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
<div class="dialog-list">
  {#each $items as item}
    <button on:click={() => handleSelect(item.id)}>
      <span style="width: 100%; text-align: left;">
        {item.caption}
      </span>
    </button>
  {/each}
</div>

<!-- </dialog> -->

<style>
  :global(body) {
    --primary-color: #007bff;
    --hover-color: #0056b3;
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
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
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
