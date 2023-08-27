import { Field, Entity, EntityBase, Fields } from '../remult3'
import { describeClass } from '../remult3/DecoratorReplacer'

import { testAll } from './db-tests-setup'
import { describe, it, expect } from 'vitest'

describe('custom id column', () => {
  testAll('basic test', async ({ createEntity }) => {
    let type = class extends EntityBase {
      a: number
      b: number
    }
    describeClass(type, Entity('custom', { allowApiCrud: true }), {
      a: Fields.number(),
      b: Fields.number(),
    })
    let c = await createEntity(type)
    let r = c.create()
    r.a = 1
    r.b = 1
    await r._.save()
    r = c.create()
    r.a = 2
    r.b = 2
    await r._.save()
    expect(c.metadata.idMetadata.field.key).toBe(c.metadata.fields.a.key)
  })
  testAll('basic test id column not first column', async ({ createEntity }) => {
    let type = class extends EntityBase {
      a: number
      id: number
    }
    Entity('custom2', { allowApiCrud: true })(type)
    Fields.number()(type.prototype, 'a')
    Fields.number()(type.prototype, 'id')
    let c = await createEntity(type)
    let r = c.create()
    r.a = 1
    r.id = 5
    await r._.save()
    r = c.create()
    r.a = 2
    r.id = 6
    await r._.save()
    expect(r._.repository.metadata.idMetadata.field.key).toBe(
      r._.fields.id.metadata.key,
    )
    expect((await c.findId(6)).a).toBe(2)
  })
})
//typing game

// var z = <Z>(y: Z) => {

// }
// z<number>(1);

// function myBackendMethod<T>(types: T, values: values<T>) {

// }

// type values<T> = {
//     [Property in keyof T]: T[Property] extends new (...args: any[]) => infer R ? R : any;
// };

// const a1 = AccountManager;

// const a = {
//     a: String.prototype,
//     b: AccountManager.prototype
// };

// var zzz: AccountManager = undefined!;

// myBackendMethod({
//     a: String,
//     b: AccountManager
// }, {
//     b: new AccountManager(),
//     a: "asdf"
// })
