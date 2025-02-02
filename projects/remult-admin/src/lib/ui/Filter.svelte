<script lang="ts">
  import { onMount, tick } from 'svelte'
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
  import RelationField from './RelationField.svelte'

  const defaultFilter = {
    key: '',
    operator: '$contains' as
      | keyof ContainsStringValueFilter
      | keyof ComparisonValueFilter<any>
      | '',
    value: '',
  }

  const operators: Record<
    FieldUIInfoType | 'list',
    [typeof defaultFilter.operator, string][]
  > = {
    string: [
      ['$contains', 'contains'],
      ['', 'is'],
      ['$ne', 'is not'],
    ],
    number: [
      ['', 'is'],
      ['$ne', 'is not'],
      ['$lt', '<'],
      ['$lte', '<='],
      ['$gte', '>='],
      ['$gt', '>'],
    ],
    date: [
      ['', 'is'],
      ['$ne', 'is not'],
      ['$lt', '<'],
      ['$lte', '<='],
      ['$gte', '>='],
      ['$gt', '>'],
    ],
    boolean: [
      ['', 'is'],
      ['$ne', 'is not'],
    ],
    json: [
      ['$contains', 'contains'],
      ['', 'is'],
      ['$ne', 'is not'],
    ],
    list: [
      ['', 'is'],
      ['$ne', 'is not'],
    ],
  }

  interface Props {
    fields?: FieldUIInfo[]
    filter?: EntityFilter<any>
  }

  let { fields = [], filter = $bindable({}) }: Props = $props()

  let filterValues: (typeof defaultFilter)[] = $state([])

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
    translateFilterToFilterValues()
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

    if (values.length === 0) {
      addFilter()
    }
  }

  const setValue = (
    e: any,
    field: typeof defaultFilter,
    kind: 'key' | 'operator' | 'value',
  ) => {
    field[kind] = e.target.value

    if (kind === 'key') {
      const key = e.target.value
      const defaultOp = getOperators(undefined, key)
      field['operator'] = defaultOp[0][0]

      const info = fields.find((x) => x.key == key)

      if (info.values && info.values.length > 0) {
        // @ts-ignore
        field['value'] =
          typeof info.values[0] === 'object'
            ? info.values[0].id
            : info.values[0]
      } else {
        field['value'] = ''
      }
    }

    // To trigger a refresh...
    filterValues = filterValues
  }

  let getOperators = $derived((_filterValues: any, currentFieldKey: string) => {
    const fieldWeAreTalkingAbout = fields.find((x) => x.key == currentFieldKey)

    if (
      fieldWeAreTalkingAbout?.values &&
      fieldWeAreTalkingAbout.values.length > 0
    ) {
      return operators.list
    }
    if (fieldWeAreTalkingAbout?.relationToOne) {
      return operators.list
    }

    if (fieldWeAreTalkingAbout?.type) {
      if (
        fieldWeAreTalkingAbout.values &&
        fieldWeAreTalkingAbout.values.length > 0
      ) {
        return operators[typeof fieldWeAreTalkingAbout.values[0]]
      }
      return operators[fieldWeAreTalkingAbout.type]
    }
    return operators.string
  })

  onMount(() => {
    translateFilterToFilterValues()
  })
</script>

<div>
  {#each filterValues as field, i}
    {@const info = fields.find((x) => x.key == field.key)}
    <div class="filter__group">
      <select onchange={(e) => setValue(e, field, 'key')}>
        {#each fields.filter((x) => x.key == field.key || !filterValues.find((y) => y.key == x.key)) as x}
          <option value={x.key} selected={x.key === field.key}>
            {x.caption}
          </option>
        {/each}
      </select>

      <select onchange={(e) => setValue(e, field, 'operator')}>
        {#each getOperators(filterValues, field.key) ?? [] as [key, caption]}
          <option value={key} selected={key === field.operator}>
            {caption}
          </option>
        {/each}
      </select>

      <!-- <input
        value={field.value}
        on:input={(e) => setValue(e, field, 'value')}
      /> -->
      {#if info.relationToOne}
        <RelationField
          {info}
          value={field.value}
          onchange={(e) => {
            setValue({ target: { value: e.detail._data } }, field, 'value')
          }}
        />
      {:else if info.type == 'boolean'}
        <select
          value={field.value}
          onchange={(e) => setValue(e, field, 'value')}
        >
          <option value={false}>False</option>
          <option value={true}>True</option>
        </select>
      {:else if info.values && info.values.length > 0}
        <select
          value={field.value}
          onchange={(e) => setValue(e, field, 'value')}
        >
          {#each info.values as option}
            {#if typeof option == 'object'}
              <option value={String(option.id)}>{option.caption}</option>
            {:else}
              <option value={String(option)}>{option}</option>
            {/if}
          {/each}
        </select>
      {:else if info.type == 'number'}
        <input
          value={field.value}
          onchange={(e) => setValue(e, field, 'value')}
          type="number"
        />
      {:else}
        <input
          value={field.value}
          onchange={(e) => setValue(e, field, 'value')}
          type="text"
        />
      {/if}

      <button
        class="icon-button"
        onclick={() => {
          filterValues = filterValues.filter((x) => x.key !== field.key)
        }}
      >
        <Delete></Delete>
      </button>
    </div>
  {/each}

  <br />
  <button class="primary" onclick={addFilter}> + </button>

  <DialogActions>
    <button class="primary" onclick={applyFilterValues}>Apply</button>
  </DialogActions>
</div>

<style>
  .filter__group {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr auto;
    align-items: center;
    gap: 0.2rem;
  }

  input,
  select,
  button {
    border: 1px solid var(--border-color);
    border-radius: 0;
    padding: 0.2rem 0.5rem;
    margin-bottom: 0.5rem;
    min-width: 0 !important;
    height: var(--cell-height);
  }

  .icon-button {
    background: none;
    border: none;
    cursor: pointer;
  }
</style>
