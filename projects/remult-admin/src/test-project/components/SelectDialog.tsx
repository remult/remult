import { useEffect, useRef, useState } from 'react'
import { FieldRelationToOneInfo, FieldUIInfo } from '../../lib/entity-info'
import { God } from '../God'

export function SelectDialog({
  relation,
  onSelect,
  onClose,
  god,
}: {
  relation: FieldRelationToOneInfo
  onSelect: (value: any) => void
  onClose: () => void
  god: God
}) {
  const [items, setItems] = useState<{ id: any; caption: string }[]>()
  const [search, setSearch] = useState('' as string | undefined)
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [ref.current])
  useEffect(() => {
    god.getItemsForSelect(relation, search).then((x) => setItems(x))
  }, [search])
  return (
    <dialog ref={ref} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (items?.length == 1) {
            onSelect(items[0].id)
            onClose()
          }
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search"
        />
      </form>
      {items?.map((x) => (
        <div
          key={x.id}
          onClick={() => {
            onSelect(x.id)
            onClose()
          }}
        >
          {x.caption}
        </div>
      ))}
    </dialog>
  )
}
