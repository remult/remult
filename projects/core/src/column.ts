import { ClassType } from '../classType'
import { assign } from '../assign'
import {
  FieldMetadata,
  FieldOptions,
  ValueConverter,
} from './column-interfaces'

import { AndFilter, Filter } from './filter/filter-interfaces'

import {
  EntityFilter,
  FindOptions,
  getEntityRef,
  idType,
  Repository,
  RepositoryImplementation,
  __updateEntityBasedOnWhere,
} from './remult3'

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

export class CompoundIdField implements FieldMetadata<string> {
  fields: FieldMetadata[]
  constructor(...columns: FieldMetadata[]) {
    this.fields = columns
  }
  apiUpdateAllowed(item: any): boolean {
    throw new Error('Method not implemented.')
  }
  displayValue(item: any): string {
    throw new Error('Method not implemented.')
  }
  includedInApi: boolean
  toInput(value: string, inputType?: string): string {
    throw new Error('Method not implemented.')
  }
  fromInput(inputValue: string, inputType?: string): string {
    throw new Error('Method not implemented.')
  }
  getDbName(): Promise<string> {
    return Promise.resolve('')
  }
  getId(instance: any) {
    let r = ''
    this.fields.forEach((c) => {
      if (r.length > 0) r += ','
      r += instance[c.key]
    })
    return r
  }
  options: FieldOptions<any, any>
  get valueConverter(): Required<ValueConverter<string>> {
    throw new Error('cant get value converter of compound id')
  }

  target: ClassType<any>
  readonly: true

  allowNull: boolean
  dbReadOnly: boolean
  isServerExpression: boolean
  key: string
  caption: string
  inputType: string
  dbName: string

  valueType: any
  isEqualTo(value: FieldMetadata<string> | string): EntityFilter<any> {
    let result = {}
    let val = value.toString()
    let id = val.split(',')
    this.fields.forEach((c, i) => {
      result[c.key] = id[i]
    })
    return result
  }

  resultIdFilter(id: string, data: any) {
    return new Filter((add) => {
      let idParts: any[] = []
      if (id != undefined) idParts = id.split(',')
      this.fields.forEach((c, i) => {
        let val = undefined
        if (i < idParts.length) val = idParts[i]
        if (data[c.key] != undefined) val = data[c.key]
        add.isEqualTo(c, val)
      })
    })
  }
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
