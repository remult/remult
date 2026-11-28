import type { FieldUIInfo } from '../../../../core/server/remult-admin'

export function field(p: Partial<FieldUIInfo> & { key: string }): FieldUIInfo {
  return {
    readOnly: false,
    values: [],
    valFieldKey: p.key,
    caption: p.key,
    type: 'string',
    inputType: 'text',
    allowNull: false,
    ...p,
  }
}
