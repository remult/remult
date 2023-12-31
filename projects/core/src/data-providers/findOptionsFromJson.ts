import { Remult } from '../context.js'
import { Filter } from '../filter/filter-interfaces.js'
import type { EntityMetadata, FindOptions } from '../remult3/remult3.js'
import { getRelationInfo } from '../remult3/relationInfoMember.js'

//@internal
export function findOptionsFromJson(
  json: any,
  meta: EntityMetadata,
): FindOptions<any> {
  let r: any = {}
  for (const key of [
    'limit',
    'page',
    'where',
    'orderBy',
    'include',
  ] as (keyof FindOptions<any>)[]) {
    if (json[key] !== undefined) {
      if (key === 'where') {
        r[key] = Filter.entityFilterFromJson(meta, json.where)
      } else if (key === 'include') {
        let newInclude = { ...json[key] }

        for (const key in newInclude) {
          if (Object.prototype.hasOwnProperty.call(newInclude, key)) {
            let element = newInclude[key]
            if (typeof element === 'object') {
              const rel = getRelationInfo(meta.fields.find(key).options)
              if (rel) {
                element = findOptionsFromJson(
                  element,
                  new Remult().repo(rel.toType()).metadata,
                )
              }
            }
            newInclude[key] = element
          }
        }
        r[key] = newInclude
      } else r[key] = json[key]
    }
  }
  if (json.load) {
    r.load = (z) => json.load.map((y) => z.find(y))
  }
  return r
}
