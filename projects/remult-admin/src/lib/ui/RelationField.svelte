<script lang="ts">
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
    onchange: (value: any) => void
  }

  let {
    value = $bindable(),
    relationsToOneValues = {},
    info,
    onchange,
  }: Props = $props()

  let displayValue = $state(undefined)

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
    onchange(value)
    dialog.close({ success: true, data: { value } })
  }

  $effect(() => {
    getDisplayValue(value)
  })
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
