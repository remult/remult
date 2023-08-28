import { assign } from '../assign'

import type { FindOptions, idType, Repository } from './remult3/remult3'
import {
  __updateEntityBasedOnWhere,
  getEntityRef,
} from './remult3/RepositoryImplementation'
import type { RepositoryImplementation } from './remult3/RepositoryImplementation'

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
    return this.repository.getCachedByIdAsync(id)
  }
  get(id: any): any {
    if (id === undefined || id === null) return null
    return this.repository.getCachedById(id)
  }
  storedItem: { item: T }
  set(item: T) {
    this.storedItem = undefined
    if (item) {
      if (typeof item === 'string' || typeof item === 'number')
        this.id = item as any
      else {
        let eo = getEntityRef(item, false)
        if (eo) {
          this.repository.addToCache(item)
          this.id = eo.getId()
        } else {
          this.storedItem = { item }
          this.id = item[this.repository.metadata.idMetadata.field.key]
        }
      }
    } else if (item === null) {
      this.id = null
    } else {
      this.id = undefined
    }
  }

  constructor(
    private repository: RepositoryImplementation<T>,
    public id: idType<T>,
  ) {}

  get item(): T {
    if (this.storedItem) return this.storedItem.item
    return this.get(this.id)
  }
  async waitLoad() {
    return this.waitLoadOf(this.id)
  }
}
9000

export class OneToMany<T> {
  constructor(
    private provider: Repository<T>,
    private settings?: {
      create?: (newItem: T) => void
    } & FindOptions<T>,
  ) {}
  private _items: T[]
  private _currentPromise: Promise<T[]>
  get lazyItems() {
    this.load()
    return this._items
  }
  async load() {
    if (this._currentPromise != null) return this._currentPromise
    if (this._items === undefined) this._items = []
    return (this._currentPromise = this.find().then((x) => {
      this._items.splice(0)
      this._items.push(...x)
      return this._items
    }))
  }

  private async find(): Promise<T[]> {
    return this.provider.find(this.settings)
  }
  create(item?: Partial<T>): T {
    let r = this.provider.create()
    __updateEntityBasedOnWhere(this.provider.metadata, this.settings.where, r)
    assign(r, item)

    return r
  }
}
