import { useEffect, useState } from 'react'
import { FieldUIInfo } from '../../../core/server/remult-admin'
import { God } from '../God'
import { SelectDialog } from './SelectDialog'

export function RelationField({
  value,
  onChange,
  info,
  god,
}: {
  value: any
  onChange: (value: any) => void
  info: FieldUIInfo
  god: God
}) {
  const [displayValue, setDisplayValue] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  useEffect(() => {
    god.displayValueFor(info, value).then((value) => {
      setDisplayValue(value)
    })
  }, [value])
  return (
    <div>
      {displayValue}
      <button className="icon-button" onClick={() => setDialogOpen(true)}>🔎</button>
      {dialogOpen && (
        <SelectDialog
          relation={info.relationToOne!}
          onSelect={onChange}
          god={god}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </div>
  )
}
