<script lang="ts">
  import { tick } from 'svelte'
  import type {
    FieldUIInfo,
    FieldUIInfoType,
  } from '../../../../core/server/remult-admin'
  import type {
    ComparisonValueFilter,
    ContainsStringValueFilter,
    EntityFilter,
  } from '../../../../core/src/remult3/remult3'
  import { dialog } from './dialog/dialog.js'
  import DialogActions from './dialog/DialogActions.svelte'
  import Delete from '../icons/Delete.svelte'

  const defaultFilter = {
    key: '',
    operator: '$contains' as
      | keyof ContainsStringValueFilter
      | keyof ComparisonValueFilter<any>
      | '',
    value: '',
  }

  const operators: Record<
    FieldUIInfoType,
    [typeof defaultFilter.operator, string][]
  > = {
    string: [
      ['$contains', 'contains'],
      ['', 'equal'],
      ['$ne', 'not equal'],
    ],
    number: [
      ['', 'equal'],
      ['$ne', 'not equal'],
      ['$lt', '<'],
      ['$lte', '<='],
      ['$gte', '>='],
      ['$gt', '>'],
    ],
    date: [
      ['', 'equal'],
      ['$ne', 'not equal'],
      ['$lt', '<'],
      ['$lte', '<='],
      ['$gte', '>='],
      ['$gt', '>'],
    ],
    boolean: [
      ['', 'equal'],
      ['$ne', 'not equal'],
    ],
    json: [
      ['$contains', 'contains'],
      ['', 'equal'],
      ['$ne', 'not equal'],
    ],
  }

  export let fields: FieldUIInfo[] = []
  export let filter: EntityFilter<any> | undefined

  let filterValues: (typeof defaultFilter)[]
  $: filterValues = []

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
    dialog.close({ success: true, data: filter })
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
    field[kind] = e.target.value

    if (kind === 'key') {
      const defaultOp = getOperators(undefined, e.target.value)
      field['operator'] = defaultOp[0][0]
    }

    // To trigger a refresh...
    filterValues = filterValues
  }

  $: getOperators = (_filterValues: any, currentField: any) => {
    const fieldWeAreTalkingAbout = fields.filter(
      (x) => x.key == currentField.key,
    )[0]

    if (fieldWeAreTalkingAbout?.type) {
      if (
        fieldWeAreTalkingAbout.values &&
        fieldWeAreTalkingAbout.values.length > 0
      ) {
        return operators[typeof fieldWeAreTalkingAbout.values[0].id]
      }
      return operators[fieldWeAreTalkingAbout.type]
    }
    return operators.string
  }
</script>

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
        {#each getOperators(filterValues, field) as [key, caption]}
          <option value={key} selected={key === field.operator}>
            {caption}
          </option>
        {/each}
      </select>

      <input
        value={field.value}
        on:input={(e) => setValue(e, field, 'value')}
      />

      <button
        class="icon-button"
        on:click={() => (filterValues = filterValues.filter((x) => x != field))}
      >
        <Delete></Delete>
      </button>
    </div>
  {/each}

  <br />
  <button class="primary" on:click={addFilter}> + </button>

  <DialogActions>
    <button class="primary" on:click={applyFilterValues}>Apply</button>
  </DialogActions>
</div>

<style>
  .filter__group {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    align-items: center;
    gap: 0.5rem;
  }

  select {
    border: 0.5px solid gainsboro;
  }
  input {
    border: 0.5px solid gainsboro;
  }

  .icon-button {
    background: none;
    border: none;
    cursor: pointer;
  }
</style>
