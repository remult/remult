import { useEffect, useState } from 'react'

import {
  EntityRelationToManyInfo,
  FieldUIInfo,
} from '../../../core/server/remult-admin'
import { EditableRow } from './EditableRow'
import Filter from './Filter'
import { God } from '../God'
import {
  EntityFilter,
  FindOptions,
  Repository,
} from '../../../core/src/remult3/remult3'

export function Table({
  columns,
  relations,
  repo,
  god,
  parentRelation,
}: {
  columns: FieldUIInfo[]
  relations: EntityRelationToManyInfo[]
  repo: Repository<any>
  god: God
  parentRelation?: Record<string, any>
}) {
  const [items, setItems] = useState<any[]>()
  const [totalRows, setTotalRows] = useState(0)

  const [newRow, setNewRow] = useState()
  const [options, setOptions] = useState<FindOptions<any>>({})
  const [userFilter, setUserFilter] = useState<EntityFilter<any>>({})
  useEffect(() => {
    return repo
      .liveQuery({
        ...options,
        where: {
          $and: [userFilter, { ...parentRelation }],
        },
      })
      .subscribe((info) => {
        setItems(info.applyChanges)
      })
  }, [options, userFilter, columns, repo, parentRelation])
  useEffect(() => {
    repo.count({ $and: [userFilter, { ...parentRelation }] }).then(setTotalRows)
  }, [userFilter, parentRelation, repo])
  useEffect(() => {
    setItems(undefined)
    setUserFilter({})
    setOptions({ limit: 25, page: 1 })
    setNewRow(undefined)
  }, [repo, columns])

  function toggleOrderBy(key: string) {
    let dir = options.orderBy?.[key]
    if (dir === undefined) dir = 'asc'
    else if (dir === 'asc') dir = 'desc'
    else dir = undefined
    setOptions({ ...options, orderBy: { [key]: dir } })
  }


  return (
    <>
      <div className="page-bar">

          <button
            className="icon-button"
            onClick={() => {
              const nav = document.querySelector('body')
              nav?.classList.toggle('hide-navigation')
            }}
          >
          <svg className="hamburger-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect y="4.68134" width="24" height="2.03049" fill="black"/><rect y="10.9847" width="24" height="2.03049" fill="black"/><rect y="17.2882" width="24" height="2.03049" fill="black"/></svg>
          </button>

          <div className="page-bar__title">{repo.metadata.caption}</div>

          <Filter
            fields={columns}
            filter={userFilter}
            setFilter={(where) => setUserFilter(where)}
          />

          <span>
            {((options.page || 1) - 1) * options.limit! +
              1 +
              ' - ' +
              (((options.page || 1) - 1) * options.limit! +
                (items?.length || 0))}{' '}
            of {totalRows}
          </span>

          <button
            className="icon-button"
            onClick={() =>
              setOptions({ ...options, page: (options.page || 2) - 1 })
            }
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
          </button>

          <button
            className="icon-button"
            onClick={() =>
              setOptions({ ...options, page: (options.page || 1) + 1 })
            }
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
          </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              {relations?.length > 0 && <td />}
              {columns.map((x) => (
                <th key={x.key} onClick={() => toggleOrderBy(x.key)}>
                  {x.caption}{' '}
                  {options.orderBy?.[x.key] === 'asc'
                    ? '▲'
                    : options.orderBy?.[x.key] === 'desc'
                    ? '▼'
                    : ''}
                </th>
              ))}
              <th className="action-tab">Actions </th>
            </tr>
          </thead>
          <tbody>
            {items?.map((row) => (
              <EditableRow
                key={repo.metadata.idMetadata.getId(row)}
                rowId={repo.metadata.idMetadata.getId(row)}
                row={row}
                save={async (item) => {
                  await repo.update(row, item)
                }}
                deleteAction={() => repo.delete(row)}
                columns={columns}
                relations={relations}
                god={god}
              />
            ))}
            {newRow ? (
              <EditableRow
                row={newRow}
                rowId={undefined!}
                deleteAction={async () => setNewRow(undefined)}
                save={async (item) => {
                  await repo.insert(item)
                  setNewRow(undefined)
                }}
                columns={columns}
                god={god}
                relations={relations}
              ></EditableRow>
            ) : (
              <tr>
                <td colSpan={columns.length + 2} className="action-tab">
                  <button
                    className="icon-button"
                    onClick={() =>
                      setNewRow(repo.create({ ...parentRelation }))
                    }
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
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
