import { useEffect, useRef, useState } from 'react'
import { FieldUIInfo } from '../../../core/server/remult-admin'
import {
  ComparisonValueFilter,
  ContainsStringValueFilter,
  EntityFilter,
} from '../../../core/src/remult3/remult3'

const defaultFilter: {
  key: string
  operator: (
    | keyof ContainsStringValueFilter
    | keyof ComparisonValueFilter<any>
    | ''
  ) &
    string
  value: any
} = { key: '', operator: '$contains', value: '' }

const operators: [typeof defaultFilter.operator, string][] = [
  ['', 'equal'],
  ['$contains', 'contains'],
  ['$ne', 'nor equal'],
]

export default function Filter({
  fields,
  filter,
  setFilter,
}: {
  fields: FieldUIInfo[]
  filter?: EntityFilter<any>
  setFilter: (filter: EntityFilter<any>) => void
}) {
  const [filterValues, setFilterValues] = useState<(typeof defaultFilter)[]>([])
  const ref = useRef<HTMLDialogElement>(null)

  function addFilter() {
    setFilterValues([
      ...filterValues,
      {
        ...defaultFilter,
        key:
          fields.find(
            (x) => x.key != 'id' && !filterValues.find((y) => y.key == x.key),
          )?.key || '',
      },
    ])
  }

  return (
    <>
      {' '}
      <button
        onClick={() => {
          ref.current?.showModal()
          translateFilterToFilterValues()
        }}
      >
        Filter
      </button>
      <dialog ref={ref} className="filter">
        <strong>Filter</strong>
        <div>
          {filterValues?.map((field, i) => {
            function set(key: keyof typeof field, value: any) {
              setFilterValues(
                filterValues.map((x, j) =>
                  i === j ? { ...x, [key]: value } : x,
                ),
              )
            }

            return (
              <div className="filter__group" key={field.key}>
                <select onChange={(e) => set('key', e.target.value)}>
                  {fields
                    .filter(
                      (x) =>
                        x.key == field.key ||
                        !filterValues.find((y) => y.key == x.key),
                    )
                    .map((x) => (
                      <option
                        key={x.key}
                        value={x.key}
                        selected={x.key === field.key}
                      >
                        {x.caption}
                      </option>
                    ))}
                </select>
                <select onChange={(e) => set('operator', e.target.value)}>
                  {operators.map(([key, caption]) => (
                    <option
                      key={key}
                      value={caption}
                      selected={key === field.operator}
                    >
                      {caption}
                    </option>
                  ))}
                </select>
                <input
                  value={field.value}
                  onChange={(e) => set('value', e.target.value)}
                />
                <button
                  className="button-icon"
                  onClick={() =>
                    setFilterValues(filterValues.filter((x) => x != field))
                  }
                ><svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2.23254" y="0.796844" width="24" height="2.03049" transform="rotate(45 2.23254 0.796844)" fill="black"/><rect x="0.796875" y="17.7673" width="24" height="2.03049" transform="rotate(-45 0.796875 17.7673)" fill="black"/></svg></button>
              </div>  
            )
          })}
          <button className="filter__add" onClick={addFilter}>Add</button>
          <div className="filter__actions">
            <button
              onClick={() => {
                ref.current?.close()
              }}
            >
              Cancel
            </button>
            <button onClick={() => applyFilterValues()}>Apply</button>
          </div>
        </div>
      </dialog>
    </>
  )

  function applyFilterValues() {
    let filter: any = {}
    for (const f of filterValues) {
      if (f.operator === '') {
        filter[f.key] = f.value
      } else {
        filter[f.key] = { [f.operator]: f.value }
      }
    }
    setFilter(filter)
    ref.current?.close()
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
    setFilterValues(values)
    if (values.length == 0) {
      addFilter()
    }
  }
}
