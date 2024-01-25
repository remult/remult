import { FieldUIInfo } from '../../lib/entity-info'
import { God } from '../God'
import { RelationField } from './RelationField'
import {
  Content,
  JSONContent,
  JSONEditor,
  JSONEditorPropsOptional,
} from 'vanilla-jsoneditor'
import { useEffect, useMemo, useRef, useState } from 'react'

export function EditableField({
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
  if (info.relationToOne)
    return (
      <RelationField value={value} onChange={onChange} info={info} god={god} />
    )
  if (info.type == 'json')
    return <EditableJson {...{ value, onChange, info, god }} />
  return <input value={value} onChange={(e) => onChange(e.target.value)} />
}

export function EditableJson({
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
  const ref = useRef<HTMLDialogElement>(null)

  const [show, setShow] = useState(false)
  return (
    <>
      <button
        className="icon-button"
        onClick={() => {
          setShow(true)

          ref.current?.showModal()
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
            d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
          />
        </svg>
      </button>
      <dialog
        ref={ref}
        onClose={() => setShow(false)}
        style={{
          width: '90vw',
          height: '90vh',
        }}
      >
        <div
          style={{ flexDirection: 'column', display: 'flex', height: '100%' }}
        >
          {show && (
            <SvelteJSONEditor
              content={{ json: value }}
              onChange={(x: any) => {
                console.log(x)
                if (JSON.stringify(x.json) != JSON.stringify(value)) {
                  onChange(x.json)
                }
              }}
            />
          )}
          <button onClick={() => ref.current?.close()}>Close</button>
        </div>
      </dialog>
    </>
  )
}

export default function SvelteJSONEditor(props: JSONEditorPropsOptional) {
  const refContainer = useRef<HTMLDivElement>(null)
  const refEditor = useRef<JSONEditor | null>()

  useEffect(() => {
    // create editor
    if (refContainer.current) {
      refEditor.current = new JSONEditor({
        target: refContainer.current,
        props: {},
      })

      return () => {
        // destroy editor
        if (refEditor.current) {
          refEditor.current.destroy()
          refEditor.current = null
        }
      }
    }
  }, [refEditor.current])

  // update props
  useEffect(() => {
    if (refEditor.current) {
      refEditor.current.updateProps(props)
    }
  }, [props])

  return <div ref={refContainer} style={{ flexGrow: 1 }}></div>
}
