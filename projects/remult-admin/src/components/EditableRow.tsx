import { useEffect, useMemo, useState } from 'react'

import { EditableField } from './EditableField'
import {
  EntityRelationToManyInfo,
  FieldUIInfo,
} from '../../../core/server/remult-admin'
import { God } from '../God'
import { Table } from './table'
import { ErrorInfo } from '../../../core/src/data-interfaces'

export function EditableRow({
  row,
  save,
  columns,
  relations,
  deleteAction,
  god,
  rowId,
}: {
  row: any
  save: (data: any) => Promise<void>
  deleteAction?: () => Promise<void>
  columns: FieldUIInfo[]
  relations: EntityRelationToManyInfo[]
  god: God
  rowId: any
}) {
  const [value, setValue] = useState(row)
  const [error, setError] = useState<ErrorInfo>()
  const [relation, setRelation] = useState<EntityRelationToManyInfo | false>(
    false,
  )
  const relationWhere = useMemo(() => {
    const result: any = {}
    if (typeof relation === 'object')
      for (const key in relation.fields) {
        if (Object.prototype.hasOwnProperty.call(relation.fields, key)) {
          const element = relation.fields[key]
          result[key] = row[element]
        }
      }
    return result
  }, [relation, row])
  const relationTable = useMemo(
    () =>
      typeof relation === 'object' &&
      god.tables.find((x) => x.key === relation.entityKey),
    [relation],
  )
  useEffect(() => {
    setValue(row)
  }, [row])
  const changed = useMemo(
    () => Boolean(columns.find((x) => value[x.key] != row[x.key])),
    [value, row],
  )
  async function doSave() {
    try {
      setError(undefined)
      await save(value)
    } catch (err: any) {
      alert(err.message)
      setError(err)
    }
  }

  return (
    <>
      <tr>
        {relations?.length > 0 && (
          <td>
            <button
              className={'icon-button' + (relation ? ' open' : '')}
              title="Relations"
              onClick={() => setRelation(relation ? false : relations[0])}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
          </td>
        )}
        {columns.map((x) => (
          <td key={x.key} style={{ whiteSpace: 'nowrap' }}>
            <EditableField
              info={x}
              value={value[x.valFieldKey]}
              onChange={(fieldValue) => {
                setValue({ ...value, [x.valFieldKey]: fieldValue })
                if (error?.modelState?.[x.valFieldKey])
                  setError({
                    ...error,
                    modelState: {
                      ...error.modelState,
                      [x.valFieldKey]: undefined,
                    },
                  })
              }}
              god={god}
            />

            {error?.modelState?.[x.key] && (
              <div style={{ fontSize: 'small', color: 'red' }}>
                {error?.modelState?.[x.valFieldKey]}
              </div>
            )}
          </td>
        ))}
        <td className="action-tab">
          {changed && (
            <>
              <button className="icon-button" title="Save" onClick={doSave}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12"
                  />
                </svg>
              </button>
              <button
                className="icon-button"
                title="Cancel"
                onClick={() => {
                  setValue(row)
                  setError(undefined)
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                  />
                </svg>
              </button>
            </>
          )}
          {deleteAction && (
            <button
              className="icon-button"
              title="Delete"
              onClick={async () => {
                try {
                  await deleteAction()
                } catch (err: any) {
                  alert(err.message)
                }
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </button>
          )}
        </td>
      </tr>
      {relation && (
        <tr className="extended">
          <td></td>
          <td colSpan={columns.length + 2}>
            <div className="extended__holder">
              <div className="extended__links">
              {relations.map((r) => (
                <a
                  key={r.entityKey}
                  className={'tab ' + (r === relation ? 'active' : '')}
                  href=""
                  onClick={(e) => {
                    setRelation(r)
                    e.preventDefault()
                  }}
                >
                  {god.tables.find((x) => x.key === r.entityKey)!.caption}
                </a>
              ))}
              </div>

              {relationTable && typeof relation === 'object' && (
                <Table
                  columns={relationTable.fields}
                  god={god}
                  relations={relationTable.relations}
                  repo={relationTable.repo}
                  parentRelation={relationWhere}
                />
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
