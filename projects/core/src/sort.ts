import { CompoundIdField } from './column'
import { FieldMetadata } from './column-interfaces'
import { EntityMetadata, EntityOrderBy } from './remult3'
export class Sort {
  toEntityOrderBy(): EntityOrderBy<any> {
    let result: any = {}
    for (const seg of this.Segments) {
      if (seg.isDescending) {
        result[seg.field.key] = 'desc'
      } else result[seg.field.key] = 'asc'
    }
    return result
  }
  constructor(...segments: SortSegment[]) {
    this.Segments = segments
  }
  Segments: SortSegment[]
  reverse() {
    let r = new Sort()
    for (const s of this.Segments) {
      r.Segments.push({ field: s.field, isDescending: !s.isDescending })
    }
    return r
  }
  compare(a: any, b: any) {
    let r = 0
    for (let i = 0; i < this.Segments.length; i++) {
      let seg = this.Segments[i]
      let left = a[seg.field.key]
      let right = b[seg.field.key]
      if (left > right) r = 1
      else if (left < right) r = -1
      if (r != 0) {
        if (seg.isDescending) r *= -1
        return r
      }
    }
    return r
  }
  static translateOrderByToSort<T>(
    entityDefs: EntityMetadata<T>,
    orderBy: EntityOrderBy<T>,
  ): Sort {
    if (!orderBy) return undefined
    let sort: Sort
    if (orderBy) {
      sort = new Sort()
      for (const key in orderBy) {
        if (Object.prototype.hasOwnProperty.call(orderBy, key)) {
          const element = orderBy[key]
          let field = entityDefs.fields.find(key)
          if (field) {
            switch (element) {
              case 'desc':
                sort.Segments.push({ field, isDescending: true })
                break
              case 'asc':
                sort.Segments.push({ field })
            }
          }
        }
      }
    }
    return sort
  }
  static createUniqueSort<T>(
    entityMetadata: EntityMetadata<T>,
    orderBy: Sort,
  ): Sort {
    if (!orderBy || Object.keys(orderBy).length === 0)
      orderBy = Sort.translateOrderByToSort(
        entityMetadata,
        entityMetadata.options.defaultOrderBy,
      )
    if (!orderBy) orderBy = new Sort({ field: entityMetadata.idMetadata.field })

    if (entityMetadata.idMetadata.field instanceof CompoundIdField) {
      for (const field of entityMetadata.idMetadata.field.fields) {
        if (!orderBy.Segments.find((x) => x.field == field)) {
          orderBy.Segments.push({ field: field })
        }
      }
    } else if (
      !orderBy.Segments.find((x) => x.field == entityMetadata.idMetadata.field)
    ) {
      orderBy.Segments.push({ field: entityMetadata.idMetadata.field })
    }
    return orderBy
  }
  static createUniqueEntityOrderBy<T>(
    entityMetadata: EntityMetadata<T>,
    orderBy: EntityOrderBy<T>,
  ): EntityOrderBy<T> {
    if (!orderBy || Object.keys(orderBy).length === 0)
      orderBy = entityMetadata.options.defaultOrderBy
    if (!orderBy)
      orderBy = {
        [entityMetadata.idMetadata.field.key]: 'asc',
      } as EntityOrderBy<T>
    else orderBy = { ...orderBy }

    if (entityMetadata.idMetadata.field instanceof CompoundIdField) {
      for (const field of entityMetadata.idMetadata.field.fields) {
        if (!orderBy[field.key]) {
          orderBy[field.key] = 'asc'
        }
      }
    } else if (!orderBy[entityMetadata.idMetadata.field.key]) {
      orderBy[entityMetadata.idMetadata.field.key] = 'asc'
    }

    return orderBy
  }
}
export interface SortSegment {
  field: FieldMetadata
  isDescending?: boolean
}
