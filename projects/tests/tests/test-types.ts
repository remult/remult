import { Fields, IdEntity, Relations, type OmitEB } from '../../core'

type OmitFunctions<T> = Pick<
  T,
  { [K in keyof T]: T[K] extends Function ? never : K }[keyof T]
>
export declare type EntityOrderBy<entityType> = {
  [Properties in keyof Partial<OmitFunctions<OmitEB<entityType>>>]?:
    | 'asc'
    | 'desc'
}

class Person extends IdEntity {
  @Fields.string()
  name = ''
  @Relations.toOne(() => Person)
  parent?: Person

  x: EntityOrderBy<this>
  aFunction() {
    this._.relations
  }
}

let orderBy: EntityOrderBy<Person> = {
  id: 'asc',
}
let p = new Person()
