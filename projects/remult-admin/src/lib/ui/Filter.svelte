<script lang="ts">
  import { tick } from 'svelte'
  import type { FieldUIInfo } from '../../../../core/server/remult-admin'
  import type {
    ComparisonValueFilter,
    ContainsStringValueFilter,
    EntityFilter,
  } from '../../../../core/src/remult3/remult3'

  const defaultFilter = {
    key: '',
    operator: '$contains' as
      | keyof ContainsStringValueFilter
      | keyof ComparisonValueFilter<any>
      | '',
    value: '',
  }

  const operators: [typeof defaultFilter.operator, string][] = [
    ['', 'equal'],
    ['$contains', 'contains'],
    ['$ne', 'nor equal'],
  ]

  export let fields: FieldUIInfo[] = []
  export let filter: EntityFilter<any> | undefined

  let filterValues: (typeof defaultFilter)[] = []
  let dialog: HTMLDialogElement | null = null

  function addFilter() {
    filterValues = [
      ...filterValues,
      {
        ...defaultFilter,
        key:
          fields.find(
            (x) => x.key != 'id' && !filterValues.find((y) => y.key == x.key),
          )?.key || '',
      },
    ]
  }

  function applyFilterValues() {
    let newFilter: any = {}
    for (const f of filterValues) {
      if (f.operator === '') {
        newFilter[f.key] = f.value
      } else {
        newFilter[f.key] = { [f.operator]: f.value }
      }
    }
    filter = newFilter
    tick()
    dialog?.close()
  }

  function translateFilterToFilterValues() {
    let values: (typeof defaultFilter)[] = []
    for (const key in filter) {
      if (Object.prototype.hasOwnProperty.call(filter, key)) {
        const element = filter[key]
        if (typeof element === 'object') {
          for (const operator in element) {
            if (Object.prototype.hasOwnProperty.call(element, operator)) {
              const val = element[operator]
              values.push({ key, operator, value: val })
            }
          }
        } else {
          if (element != undefined)
            values.push({ key, operator: '', value: element })
        }
      }
    }
    filterValues = values
    if (values.length == 0) {
      addFilter()
    }
  }

  $: fields && translateFilterToFilterValues()

  const setValue = (e: any, field: any, kind: 'key' | 'operator' | 'value') => {
    return (field[kind] = e.target.value)
  }
</script>

<button on:click={() => dialog?.showModal()}>Filter</button>
<dialog bind:this={dialog} class="filter">
  <strong>Filter</strong>
  <div>
    {#each filterValues as field, i}
      <div class="filter__group">
        <select on:change={(e) => setValue(e, field, 'key')}>
          {#each fields.filter((x) => x.key == field.key || !filterValues.find((y) => y.key == x.key)) as x}
            <option value={x.key} selected={x.key === field.key}>
              {x.caption}
            </option>
          {/each}
        </select>
        <select on:change={(e) => setValue(e, field, 'operator')}>
          {#each operators as [key, caption]}
            <option value={caption} selected={key === field.operator}>
              {caption}
            </option>
          {/each}
        </select>
        <input
          value={field.value}
          on:input={(e) => setValue(e, field, 'value')}
        />
        <button
          class="button-icon"
          on:click={() =>
            (filterValues = filterValues.filter((x) => x != field))}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="2.23254"
              y="0.796844"
              width="24"
              height="2.03049"
              transform="rotate(45 2.23254 0.796844)"
              fill="black"
            />
            <rect
              x="0.796875"
              y="17.7673"
              width="24"
              height="2.03049"
              transform="rotate(-45 0.796875 17.7673)"
              fill="black"
            />
          </svg>
        </button>
      </div>
    {/each}
    <button class="filter__add" on:click={addFilter}>Add</button>
    <div class="filter__actions">
      <button on:click={() => dialog?.close()}>Cancel</button>
      <button on:click={applyFilterValues}>Apply</button>
    </div>
  </div>
</dialog>

<style>
  .filter__group {
    display: flex;
    align-items: center;
  }
  .filter__add {
    margin-top: 10px;
  }
  .filter__actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }
  .button-icon {
    background: none;
    border: none;
    cursor: pointer;
  }
</style>
