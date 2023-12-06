import { Fields, IdEntity, Relations, type OmitEB, getEntityRef, repo, ObjectMembersOnly } from '../../../dist/remult'

type OmitFunctions<T> = T
//  Pick<
//   T,
//   { [K in keyof T]: T[K] extends Function ? never : K }[keyof T]
// >
export declare type MyEntityOrderBy<entityType> = {
  [Properties in keyof Partial<OmitFunctions<OmitEB<entityType>>>]?:
    | 'asc'
    | 'desc'
}

class Person extends IdEntity {
  @Fields.string()
  name = ''
  @Relations.toOne(() => Person)
  parent?: Person

  x!: MyEntityOrderBy<Person>
  async aFunction() {
    this.$.name
    this._.fields.name
    this._.relations.
  }
}

repo(Person).relations({}).parent

let orderBy: MyEntityOrderBy<Person> = {
  id: 'asc',
}
let p = new Person()
