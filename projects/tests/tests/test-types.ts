import {
  Fields,
  IdEntity,
  Relations,
  EntityBase,
  EntityFilter,
  repo,
} from '../../core'

export declare type MyEntityOrderBy<entityType> = {
  [Properties in keyof Partial<
    MembersOnly<entityType>
  >]?: entityType[Properties]
}

class Person extends IdEntity {
  @Fields.string()
  name = ''
  @Relations.toOne(() => Person)
  parent?: Person

  async aFunction() {
    this._.relations
  }

  f = new Promise(() => this.$.name)
  g = () => this.$
}

let orderBy: MyEntityOrderBy<Person> = {
  id: 'asc',
}
let p = new Person()

type KeysNotOfAType<TSchema, Type> = {
  [key in keyof TSchema]: TSchema extends EntityBase
    ? key
    : NonNullable<TSchema[key]> extends Type
    ? never
    : key
}[keyof TSchema]

type OmitFunctions<entityType> = {
  [Properties in KeysNotOfAType<entityType, Function>]: entityType[Properties]
}

type MembersOnly<T> = OmitFunctions<Omit<T, keyof Pick<EntityBase, '$' | '_'>>>
const x: MembersOnly<Person>

class HelperBase extends EntityBase {
  id = 0
  name = ''
  date?: Date
}
class Helper extends HelperBase {
  title = ''
}

let f: EntityFilter<HelperBase> = {}

let f2: EntityFilter<Helper> = {
  ...f,
}
