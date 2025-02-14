<script lang="ts">
  import { run } from 'svelte/legacy'

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

  const getDisplayValue = async (_value) => {
    if (_value === null) {
      displayValue = '- Unset -'
    } else {
      displayValue =
        relationsToOneValues[info.valFieldKey] &&
        relationsToOneValues[info.valFieldKey].get(value)
      if (displayValue === undefined) {
        displayValue = await $godStore.displayValueFor(info, value)
      }
    }
  }

  $effect(() => {
    if (value === null) {
      displayValue = '- Unset -'
    } else {
      displayValue =
        relationsToOneValues[info.valFieldKey] &&
        relationsToOneValues[info.valFieldKey].get(value)
      if (displayValue === undefined) {
        $godStore.displayValueFor(info, value).then((v) => {
          displayValue = v
        })
      }
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
  // run(() => {
  //   getDisplayValue(value)
  // });
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
