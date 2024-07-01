<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import { writable } from 'svelte/store'
  import type { FieldRelationToOneInfo } from '../../../../core/server/remult-admin'

  import { godStore } from '../../stores/GodStore.js'

  export let relation: FieldRelationToOneInfo

  const items = writable<{ id: any; caption: string }[]>([])
  const search = writable<string | undefined>('')

  let dialog: HTMLDialogElement

  const dispatch = createEventDispatcher()

  function dispatchSelect(_data) {
    dispatch('select', { _data })
  }

  function dispatchClose() {
    dispatch('close', {})
  }

  onMount(() => {
    dialog.showModal()
  })

  const refresh = (s: any) => {
    $godStore.getItemsForSelect(relation, $search).then((x) => items.set(x))
  }

  $: relation && refresh($search)

  function handleSubmit(e: Event) {
    e.preventDefault()
    let currentItems
    items.subscribe((value) => (currentItems = value))
    if (currentItems?.length === 1) {
      dispatchSelect(currentItems[0].id)
      dispatchClose()
    }
  }

  function handleSelect(id: any) {
    dispatchSelect(id)
    dialog.close()
    dispatchClose()
  }
</script>

<!-- onClose -->
<dialog bind:this={dialog}>
  <form on:submit={handleSubmit}>
    <input bind:value={$search} placeholder="search" />
  </form>
  {#each $items as item}
    <div>
      <button on:click={() => handleSelect(item.id)}>
        {item.caption}
      </button>
    </div>
  {/each}
</dialog>

<style>
  /* Add any necessary styles here */
</style>
