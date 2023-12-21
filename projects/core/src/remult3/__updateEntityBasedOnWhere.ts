import { Filter } from '../filter/filter-interfaces.js'
import type { EntityFilter, EntityMetadata } from './remult3.js'

export function __updateEntityBasedOnWhere<T>(
  entityDefs: EntityMetadata<T>,
  where: EntityFilter<T>,
  r: T,
) {
  let w = Filter.fromEntityFilter(entityDefs, where)
  const emptyFunction = () => {}
  if (w) {
    w.__applyToConsumer({
      custom: emptyFunction,
      databaseCustom: emptyFunction,
      containsCaseInsensitive: emptyFunction,
      notContainsCaseInsensitive: emptyFunction,
      isDifferentFrom: emptyFunction,
      isEqualTo: (col, val) => {
        r[col.key] = val
      },
      isGreaterOrEqualTo: emptyFunction,
      isGreaterThan: emptyFunction,
      isIn: emptyFunction,
      isLessOrEqualTo: emptyFunction,
      isLessThan: emptyFunction,
      isNotNull: emptyFunction,
      isNull: emptyFunction,

      or: emptyFunction,
    })
  }
}
