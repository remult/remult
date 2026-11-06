import type { FieldMetadata } from './column-interfaces.js'
import { remultStatic } from './remult-static.js'
import { getRelationFieldInfo } from './remult3/relationInfoMember.js'
import type {
  EntityMetadata,
  EntityOrderBy,
  RelationOptions,
} from './remult3/remult3.js'

/**
 * The `Sort` class is used to describe sorting criteria for queries. It is mainly used internally,
 * but it provides a few useful functions for working with sorting.
 */
export class Sort {
  /**
   * Translates the current `Sort` instance into an `EntityOrderBy` object.
   *
   * @returns {EntityOrderBy<any>} An `EntityOrderBy` object representing the sort criteria.
   */
  toEntityOrderBy(): EntityOrderBy<any> {
    let result: any = {}
    for (const seg of this.Segments) {
      if (seg.isDescending) {
        result[seg.field.key] = 'desc'
      } else result[seg.field.key] = 'asc'
    }
    return result
  }
  /**
   * Constructs a `Sort` instance with the provided sort segments.
   *
   * @param {...SortSegment[]} segments The sort segments to be included in the sort criteria.
   */
  constructor(...segments: SortSegment[]) {
    this.Segments = segments
  }
  /**
   * The segments of the sort criteria.
   *
   * @type {SortSegment[]}
   */
  Segments: SortSegment[]
  /**
   * Reverses the sort order of the current sort criteria.
   *
   * @returns {Sort} A new `Sort` instance with the reversed sort order.
   */
  reverse() {
    let r = new Sort()
    for (const s of this.Segments) {
      r.Segments.push({ field: s.field, isDescending: !s.isDescending })
    }
    return r
  }
  /**
   * Compares two objects based on the current sort criteria.
   *
   * @param {any} a The first object to compare.
   * @param {any} b The second object to compare.
   * @param {function(FieldMetadata): string} [getFieldKey] An optional function to get the field key for comparison.
   * @returns {number} A negative value if `a` should come before `b`, a positive value if `a` should come after `b`, or zero if they are equal.
   */
  compare(a: any, b: any, getFieldKey?: (field: FieldMetadata) => string) {
    if (!getFieldKey) getFieldKey = (x) => x.key
    for (let i = 0; i < this.Segments.length; i++) {
      let seg = this.Segments[i]

      let left = a[getFieldKey(seg.field)]
      let right = b[getFieldKey(seg.field)]
      let descending = seg.isDescending
      let r = compareForSort(left, right, descending)
      if (r != 0) {
        return r
      }
    }
    return 0
  }
  /**
   * Translates an `EntityOrderBy` to a `Sort` instance.
   *
   * @template T The entity type for the order by.
   * @param {EntityMetadata<T>} entityDefs The metadata of the entity associated with the order by.
   * @param {EntityOrderBy<T>} [orderBy] The `EntityOrderBy` to be translated.
   * @returns {Sort} A `Sort` instance representing the translated order by.
   */
  static translateOrderByToSort<T>(
    entityDefs: EntityMetadata<T>,
    orderBy: EntityOrderBy<T>,
  ): Sort {
    let sort = new Sort()
    if (orderBy)
      for (const key in orderBy) {
        if (Object.prototype.hasOwnProperty.call(orderBy, key)) {
          const element = orderBy[key]
          let field = entityDefs.fields.find(key)

          const addSegment = (field: FieldMetadata) => {
            switch (element) {
              case 'desc':
                sort.Segments.push({ field, isDescending: true })
                break
              case 'asc':
                sort.Segments.push({ field })
            }
          }
          if (field) {
            const rel = getRelationFieldInfo(field)
            if (rel?.type === 'toOne') {
              const op = rel.options
              if (typeof op.field === 'string') {
                addSegment(entityDefs.fields.find(op.field))
              } else {
                if (op.fields) {
                  for (const key in op.fields) {
                    if (Object.prototype.hasOwnProperty.call(op.fields, key)) {
                      const keyInMyEntity = (op.fields as any)[key]!
                      addSegment(
                        entityDefs.fields.find(keyInMyEntity.toString()),
                      )
                    }
                  }
                }
              }
            } else addSegment(field)
          }
        }
      }
    return sort
  }
  /**
   * Creates a unique `Sort` instance based on the provided `Sort` and the entity metadata.
   * This ensures that the sort criteria result in a unique ordering of entities.
   *
   * @template T The entity type for the sort.
   * @param {EntityMetadata<T>} entityMetadata The metadata of the entity associated with the sort.
   * @param {Sort} [orderBy] The `Sort` instance to be made unique.
   * @returns {Sort} A `Sort` instance representing the unique sort criteria.
   */
  static createUniqueSort<T>(
    entityMetadata: EntityMetadata<T>,
    orderBy?: Sort,
  ): Sort {
    if (!orderBy) orderBy = new Sort()
    for (const field of entityMetadata.idMetadata.fields) {
      if (!orderBy.Segments.find((x) => x.field == field)) {
        orderBy.Segments.push({ field: field })
      }
    }
    return orderBy
  }

  /**
   * Creates a unique `EntityOrderBy` based on the provided `EntityOrderBy` and the entity metadata.
   * This ensures that the order by criteria result in a unique ordering of entities.
   *
   * @template T The entity type for the order by.
   * @param {EntityMetadata<T>} entityMetadata The metadata of the entity associated with the order by.
   * @param {EntityOrderBy<T>} [orderBy] The `EntityOrderBy` to be made unique.
   * @returns {EntityOrderBy<T>} An `EntityOrderBy` representing the unique order by criteria.
   */
  static createUniqueEntityOrderBy<T>(
    entityMetadata: EntityMetadata<T>,
    orderBy?: EntityOrderBy<T>,
  ): EntityOrderBy<T> {
    if (!orderBy || Object.keys(orderBy).length === 0)
      orderBy = entityMetadata.options.defaultOrderBy
    if (!orderBy) orderBy = {} as EntityOrderBy<T>
    else orderBy = { ...orderBy }
    for (const field of entityMetadata.idMetadata.fields) {
      if (!orderBy[field.key as keyof EntityOrderBy<T>]) {
        orderBy[field.key as keyof EntityOrderBy<T>] = 'asc'
      }
    }
    return orderBy
  }
}
export interface SortSegment {
  field: FieldMetadata
  isDescending?: boolean
}
/** A `find` sort segment, or a `groupBy` order: on `count` it has no field. */
export type OrderBySegment = Partial<SortSegment> & { operation?: string }
export interface NullOrder {
  asc: 'NULLS FIRST' | 'NULLS LAST'
  desc: 'NULLS FIRST' | 'NULLS LAST'
}

/**
 * Where NULL sorts, for the whole app: set it on both the server and the client.
 * @see https://remult.dev/docs/field-types#where-null-sorts
 */
export const NullSort: { order: NullOrder | 'native' } =
  remultStatic.nullSort || (remultStatic.nullSort = { order: 'native' })

/** Where the database sorts NULL when `ORDER BY` does not say, and how `ORDER BY` puts it elsewhere. */
export interface NativeNullSort {
  /** `unknown`: `ORDER BY` always writes the NULL order. */
  order: NullOrder | 'unknown'
  syntax: 'NULLS FIRST/LAST' | 'CASE WHEN'
}

/** Remult's own order, without a database: `native` is NULL lowest. */
export function isNullFirstSort(isDescending?: boolean): boolean {
  if (NullSort.order === 'native') return !isDescending
  return NullSort.order[isDescending ? 'desc' : 'asc'] === 'NULLS FIRST'
}

/** The NULL order `ORDER BY` must write, `undefined` when the database's own is right. */
export function nullSortToWrite(
  nativeOrder: NullOrder | 'unknown',
  { field, isDescending, operation }: OrderBySegment,
): 'NULLS FIRST' | 'NULLS LAST' | undefined {
  // A distinct count is never NULL; other aggregates are NULL only over NULL values.
  const canBeNull = !!field?.allowNull && operation !== 'distinctCount'
  if (!canBeNull || NullSort.order === 'native') return undefined
  const dir = isDescending ? 'desc' : 'asc'
  const order = NullSort.order[dir]
  if (nativeOrder !== 'unknown' && nativeOrder[dir] === order) return undefined
  return order
}

export function compareForSort(
  left: any,
  right: any,
  descending: boolean | undefined,
) {
  left = fixValueForSort(left)
  right = fixValueForSort(right)
  // `null > 'a'` and `null < 'a'` are both false, which is not an order.
  if (left == null || right == null) {
    if (left == right) return 0
    return (left == null) === isNullFirstSort(descending) ? -1 : 1
  }
  let r = 0
  if (left > right) r = 1
  else if (left < right) r = -1
  if (descending) r *= -1
  return r
}

export function fixValueForSort(a: any) {
  if (a == undefined || a == null) return a
  if (a.id !== undefined) return a.id
  return a
}
