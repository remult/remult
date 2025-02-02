<script lang="ts">
  import { writable } from 'svelte/store'
  import type { FieldRelationToOneInfo } from '../../../../core/server/remult-admin'

  import { godStore } from '../../stores/GodStore.js'

  interface Props {
    relation: FieldRelationToOneInfo
    onselect: (value) => void
  }

  let { relation, onselect }: Props = $props()

  const items = writable<{ id: any; caption: string }[]>([])
  const count = writable(0)
  const search = writable<string | undefined>('')

  const refresh = async (s: any) => {
    const ret = await $godStore.getItemsForSelect(relation, s)
    $items = ret.items
    $count = ret.$count
  }

  $effect(() => {
    relation && refresh($search)
  })

  function handleSubmit(e: Event) {
    e.preventDefault()
    let currentItems
    items.subscribe((value) => (currentItems = value))
    if (currentItems?.length === 1) {
      onselect(currentItems[0].id)
    }
  }

  function handleSelect(id: any) {
    onselect(id)
  }
</script>

<form onsubmit={handleSubmit}>
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
    <button onclick={() => handleSelect(item.id)}>
      <span style="width: 100%; text-align: left;">
        {item.caption ?? "Can't display"}
      </span>
    </button>
  {/each}
  <button
    onclick={() => handleSelect(null)}
    style="color: rgb(var(--color-black) / 0.5); margin-top: 1rem;"
  >
    <span style="width: 100%; text-align: left;"> - Unset - </span>
  </button>
</div>

<!-- </dialog> -->

<style>
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
