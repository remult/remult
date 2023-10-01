import type { CompoundIdField } from './CompoundIdField'
import { Filter } from './filter/filter-interfaces'

export function resultCompoundIdFilter(
  idField: CompoundIdField,
  id: string | undefined,
  data: any,
) {
  return new Filter((add) => {
    let idParts: any[] = []
    if (id != undefined) idParts = id.split(',')
    idField.fields.forEach((c, i) => {
      let val = undefined
      if (i < idParts.length) val = idParts[i]
      if (data[c.key] != undefined) val = data[c.key]
      add.isEqualTo(c, val)
    })
  })
}
