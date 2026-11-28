import type { FieldUIInfo } from '../../../../core/server/remult-admin'

export type Display =
  | { kind: 'empty'; text: string }
  | { kind: 'text' | 'number' | 'json' | 'date'; text: string; title?: string }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'color'; text: string }
  | { kind: 'relation'; text: string; title: string; missing: boolean }

const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** Edits bind to valFieldKey for relations, so that's where the value lives. */
export const valueKey = (f: FieldUIInfo) =>
  f.relationToOne ? f.valFieldKey : f.key

export function display(
  f: FieldUIInfo,
  value: unknown,
  caption?: unknown,
): Display {
  if (
    value === undefined ||
    value === null ||
    (f.relationToOne && value === '')
  )
    return { kind: 'empty', text: value === null ? 'null' : '' }
  if (f.relationToOne) {
    const missing = caption === undefined || caption === null || caption === ''
    return {
      kind: 'relation',
      text: missing ? String(value) : String(caption),
      title: String(value),
      missing,
    }
  }
  if (f.values.length) {
    const item = f.values.find((v) => v.id === value)
    return {
      kind: 'text',
      text: item ? item.caption : String(value),
      title: String(value),
    }
  }
  if (f.type === 'boolean') return { kind: 'boolean', value: value === true }
  if (f.type === 'number') return { kind: 'number', text: String(value) }
  if (f.type === 'json') return { kind: 'json', text: JSON.stringify(value) }
  if (f.type === 'date') {
    if (f.inputType === 'date') return { kind: 'date', text: String(value) }
    const d = new Date(String(value))
    return Number.isNaN(d.getTime())
      ? { kind: 'text', text: String(value) }
      : { kind: 'date', text: dateTime.format(d), title: String(value) }
  }
  if (f.inputType === 'color') return { kind: 'color', text: String(value) }
  const text = String(value)
  return { kind: 'text', text, title: text.length > 40 ? text : undefined }
}

const PLAIN_MAX = 60

/** One line for a tooltip: "empty" when there is no value, long text cut. */
export function plainText(
  f: FieldUIInfo,
  value: unknown,
  caption?: unknown,
): string {
  const d = display(f, value, caption)
  const text =
    d.kind === 'boolean'
      ? d.value
        ? 'Yes'
        : 'No'
      : d.kind === 'empty'
        ? 'empty'
        : d.text
  return text.length > PLAIN_MAX ? `${text.slice(0, PLAIN_MAX - 3)}...` : text
}
