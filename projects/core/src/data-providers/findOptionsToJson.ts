import { Filter } from '../filter/filter-interfaces.js'
import type { EntityMetadata, FindOptions } from '../remult3/remult3.js'
import { getRelationInfo } from '../remult3/relationInfoMember.js'
import { Remult } from '../context.js'

//@internal
export function findOptionsToJson<entityType = any>(
  options: FindOptions<entityType>,
  meta: EntityMetadata<entityType>,
) {
  if (options.include) {
    let newInclude: any = {}
    for (const key in options.include) {
      if (Object.prototype.hasOwnProperty.call(options.include, key)) {
        let element = options.include[key]
        if (typeof element === 'object') {
          const rel = getRelationInfo(meta.fields.find(key).options)
          if (rel) {
            element = findOptionsToJson(
              element,
              new Remult().repo(rel.toType()).metadata,
            )
          }
        }
        newInclude[key] = element
      }
    }
    options = { ...options, include: newInclude }
  }
  if (options.where)
    options = {
      ...options,
      where: Filter.entityFilterToJson(meta, options.where),
    }
  if (options.load)
    options = {
      ...options,
      load: options.load(meta.fields).map((y) => y.key) as any,
    }
  return options
}
