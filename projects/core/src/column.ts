import { assign } from '../assign.js'

import type { FindOptions, idType, Repository } from './remult3/remult3.js'
import { __updateEntityBasedOnWhere } from './remult3/__updateEntityBasedOnWhere.js'
import { getEntityRef } from './remult3/getEntityRef.js'
import { getRepositoryInternals } from './remult3/repository-internals.js'

export function makeTitle(name: string) {
  // insert a space before all caps
  return (
    name
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Uppercase the first character
      .replace(/^./, (str) => str.toUpperCase())
      .replace('Email', 'eMail')
  )
}

export class LookupColumn<T> {
  toJson(): any {
    if (!this.storedItem) return undefined
    if (this.item === null) return null
    return this.repository.toJson(this.item)
  }
  setId(val: any) {
    if (this.repository.metadata.idMetadata.field.valueType == Number)
      val = +val
    this.id = val
  }
  waitLoadOf(id: any) {
    if (id === undefined || id === null) return null
    return getRepositoryInternals(this.repository)._getCachedByIdAsync(
      id,
      false,
    )
  }
  get(id: any): any {
    if (id === undefined || id === null) return null

    const result = getRepositoryInternals(this.repository)._getCachedById(
      id,
      this.isReferenceRelation,
    )
    if (this.isReferenceRelation && !this.storedItem) {
      if (!this.allowNull && (this.id === 0 || this.id === '')) return null
      return undefined
    }
    return result
  }
  storedItem?: { item: T }
  set(item: T) {
    if (
      item === null &&
      !this.allowNull &&
      this.isReferenceRelation &&
      (this.id == 0 || this.id == '')
    ) {
      this.storedItem = { item: null! }
      return
    }
    this.storedItem = undefined
    if (item) {
      if (typeof item === 'string' || typeof item === 'number')
        this.id = item as any
      else {
        let eo = getEntityRef(item as any, false)
        if (eo && !this.isReferenceRelation) {
          getRepositoryInternals(this.repository)._addToCache(item)
          this.id = eo.getId() as any
        } else {
          this.storedItem = { item }
          this.id = item[
            this.repository.metadata.idMetadata.field.key as keyof T
          ] as idType<T>
        }
      }
    } else if (item === null) {
      this.id = null!
    } else {
      this.id = undefined!
    }
  }

  id?: idType<T>
  constructor(
    private repository: Repository<T>,
    private isReferenceRelation: boolean,
    private allowNull: boolean,
  ) {}

  get item(): T {
    if (this.storedItem) return this.storedItem.item
    return this.get(this.id)
  }
  async waitLoad() {
    return this.waitLoadOf(this.id)
  }
}
