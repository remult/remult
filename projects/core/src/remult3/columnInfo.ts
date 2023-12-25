import type { FieldOptions } from '../column-interfaces.js'
import type { Remult } from '../context.js'

export interface columnInfo {
  key: string
  settings: (remult: Remult) => FieldOptions
}
