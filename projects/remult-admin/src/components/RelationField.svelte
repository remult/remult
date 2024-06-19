<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import type { FieldUIInfo } from '../../../core/server/remult-admin'
  import SelectDialog from './SelectDialog.svelte'
  import { godStore } from '../stores/GodStore.js'

  export let value: any
  export let info: FieldUIInfo

  let displayValue = ''
  let dialogOpen = false

  const dispatch = createEventDispatcher()

  function dispatchChange(_data) {
    dispatch('change', { _data })
  }

  onMount(async () => {
    const val = await $godStore.displayValueFor(info, value)
    displayValue = val
  })

  $: {
    ;(async () => {
      const val = await $godStore.displayValueFor(info, value)
      displayValue = val
    })()
  }
</script>

<div>
  {displayValue}
  <button class="icon-button" on:click={() => (dialogOpen = true)}>🔎</button>
  {#if dialogOpen}
    <SelectDialog
      relation={info.relationToOne}
      on:close={() => (dialogOpen = false)}
      on:select={(e) => {
        value = e.detail._data
        dispatchChange(value)
      }}
    />
  {/if}
</div>
