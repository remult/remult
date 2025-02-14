<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import type {
    FieldUIInfo,
    RelationsToOneValues,
  } from '../../../../core/server/remult-admin'
  import SelectDialog from './DialogSelect.svelte'
  import LoadingSkeleton from './LoadingSkeleton.svelte'
  import { dialog } from './dialog/dialog.js'
  import { godStore } from '../../stores/GodStore.js'

  interface Props {
    value: any
    relationsToOneValues?: RelationsToOneValues
    info: FieldUIInfo
  }

  let { value = $bindable(), relationsToOneValues = {}, info }: Props = $props()

  let displayValue = $state(undefined)

  const dispatch = createEventDispatcher()

  function dispatchChange(_data) {
    dispatch('change', { _data })
  }

  $effect(() => {
    if (value === null) {
      displayValue = '- Unset -'
      return
    }

    const fromRelations = relationsToOneValues[info.valFieldKey]?.get(value)
    if (fromRelations !== undefined) {
      displayValue = fromRelations
      return
    }

    // TODO: I think it's coming here all the time at first render... and it should not!

    // Only fetch if we don't have a value from relations
    let cancelled = false
    displayValue = undefined // Show loading state
    $godStore.displayValueFor(info, value).then((v) => {
      if (!cancelled) {
        displayValue = v
      }
    })

    return () => {
      cancelled = true // Cleanup if effect re-runs
    }
  })

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

{#if (displayValue ?? '').startsWith("Can't display")}
  <input
    value=""
    disabled
    style="opacity: 0.5; background-color: Gainsboro; cursor: not-allowed;"
  />
{:else}
  <button
    class="naked-button"
    onclick={() => {
      dialog.show({
        config: { title: `${info.caption} selection`, width: '400px' },
        component: SelectDialog,
        props: { relation: info.relationToOne, onSelect },
      })
    }}
  >
    <div class="btn-txt">
      <span>🔎</span>
      {#if displayValue === undefined}
        <LoadingSkeleton width={getWidth()} />
      {:else}
        {displayValue}
      {/if}
    </div>
  </button>
{/if}

<style>
  button {
    padding: 0.3rem;
    width: 100%;
  }

  .btn-txt {
    width: 100%;
    text-align: left;
  }
</style>
