import {
  Fields,
  IdEntity,
  Relations,
  type MembersOnly,
  getFields,
  FieldsRef,
  getEntityRef,
} from '../../core'

export declare type MyEntityOrderBy<entityType> = {
  [Properties in keyof Partial<MembersOnly<entityType>>]?: 'asc' | 'desc'
}

class Person extends IdEntity {
  @Fields.string()
  name = ''
  @Relations.toOne(() => Person)
  parent?: Person

  async aFunction() {
    this.$.name
    this._.fields.name
  }
  myMethod() {
    return this._.save()
  }
}

let orderBy: MyEntityOrderBy<Person> = {
  id: 'asc',
}
let p = new Person()

class xx {
  name = ''

  parent: xx
  doSomething() {
    getEntityRef<xx>(this).relations.parent
  }
}
