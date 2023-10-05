import { assign } from '../assign'

import type { FindOptions, idType, Repository } from './remult3/remult3'
import { __updateEntityBasedOnWhere } from './remult3/__updateEntityBasedOnWhere'
import { getEntityRef } from './remult3/getEntityRef'
import { getRepositoryInternals } from './remult3/repository-internals'

export function makeTitle(name: string) {
  // insert a space before all caps
  return (
    name
      .replace(/([A-Z])/g, ' $1')
      // uppercase the first character
      .replace(/^./, (str) => str.toUpperCase())
      .replace('Email', 'eMail')
      .replace(' I D', ' ID')
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
    return getRepositoryInternals(this.repository).getCachedByIdAsync(id, false)
  }
  get(id: any): any {
    if (id === undefined || id === null) return null
    if (this.isReferenceRelation && !this.storedItem) return undefined
    return getRepositoryInternals(this.repository).getCachedById(
      id,
      this.isReferenceRelation,
    )
  }
  storedItem?: { item: T }
  set(item: T) {
    this.storedItem = undefined
    if (item) {
      if (typeof item === 'string' || typeof item === 'number')
        this.id = item as any
      else {
        let eo = getEntityRef(item as any, false)
        if (eo && !this.isReferenceRelation) {
          getRepositoryInternals(this.repository).addToCache(item)
          this.id = eo.getId() as any
        } else {
          this.storedItem = { item }
          this.id = item[this.repository.metadata.idMetadata.field.key]
        }
      }
    } else if (item === null) {
      this.id = null!
    } else {
      this.id = undefined!
    }
  }

  id: idType<T>
  constructor(
    private repository: Repository<T>,
    private isReferenceRelation,
  ) {}

  get item(): T {
    if (this.storedItem) return this.storedItem.item
    return this.get(this.id)
  }
  async waitLoad() {
    return this.waitLoadOf(this.id)
  }
}
