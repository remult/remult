<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import type {
    FieldUIInfo,
    RelationsToOneValues,
  } from '../../../../core/server/remult-admin'
  import SelectDialog from './SelectDialog.svelte'
  import LoadingSkeleton from './LoadingSkeleton.svelte'
  import { dialog } from './dialog/dialog.js'
  import { godStore } from '../../stores/GodStore.js'

  export let value: any
  export let relationsToOneValues: RelationsToOneValues = {}
  export let info: FieldUIInfo

  let displayValue = undefined

  const dispatch = createEventDispatcher()

  function dispatchChange(_data) {
    dispatch('change', { _data })
  }

  $: value !== undefined && getDisplayValue()

  const getDisplayValue = async () => {
    displayValue =
      relationsToOneValues[info.valFieldKey] &&
      relationsToOneValues[info.valFieldKey].get(value)
    if (displayValue === undefined) {
      displayValue = await $godStore.displayValueFor(info, value)
    }
  }

  const getWidth = () => {
    const r = Math.random()

    if (r > 0.6) {
      return 120
    }
    if (r > 0.3) {
      return 100
    }
    return 70
  }

  const onSelect = (_value: any) => {
    value = _value
    dispatchChange(value)
    dialog.close({ success: true, data: { value } })
  }
</script>

<div>
  <button
    class="naked-button"
    on:click={() => {
      dialog.show({
        config: { title: `${info.caption} selection` },
        component: SelectDialog,
        props: { relation: info.relationToOne, onSelect },
      })
    }}
  >
    <span>🔎</span>
    {#if displayValue === undefined}
      <LoadingSkeleton width={getWidth()} />
    {:else}
      {displayValue}
    {/if}
  </button>
</div>
