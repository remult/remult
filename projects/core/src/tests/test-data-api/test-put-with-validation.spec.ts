import { TestDataApiResponse } from '../TestDataApiResponse'
import { Done } from '../Done'
import { createData } from '../createData'
import { DataApi } from '../../data-api'
import { Remult } from '../../context'
import { Categories } from '../remult-3-entities'
import {
  Field,
  Entity,
  EntityBase,
  ValueListInfo,
  Fields,
  getEntityRef,
} from '../../remult3'
import { InMemoryDataProvider } from '../../..'

import { Status } from '../testModel/models'
import { ErrorInfo } from '../../data-interfaces'
import { remultFresh } from '../../../remult-fresh'
import { describe, it, expect } from 'vitest'

describe('data api', () => {
  it('put with validations fails', async () => {
    let [c, remult] = await createData(
      async (insert) => insert(1, 'noam'),
      CategoriesForThisTest,
    )

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.error = async (data: any) => {
      expect(data.modelState.categoryName).toBe('invalid')
      d.ok()
    }
    await api.put(t, 1, {
      categoryName: 'noam 1',
    })
    d.test()
    var x = await c.find({ where: { id: 1 } })
    expect(x[0].categoryName).toBe('noam')
  })
  it('post with validation fails', async () => {
    let [c, remult] = await createData(async () => {}, CategoriesForThisTest)

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.error = async (data: any) => {
      expect(data.modelState.categoryName).toBe('invalid')
      d.ok()
    }
    await api.post(t, { id: 1, categoryName: 'noam 1' })
    d.test()
    expect((await c.find()).length).toBe(0)
  })
  it('allow column update based on new row only', async () => {
    let type = class extends EntityBase {
      id: number
      val: string
    }
    Entity('allowcolumnupdatetest', { allowApiCrud: true })(type)
    Fields.integer()(type.prototype, 'id')
    Fields.string<EntityBase>({
      allowApiUpdate: (x, c) => x._.isNew(),
    })(type.prototype, 'val')
    let remult = new Remult()
    remult.dataProvider = new InMemoryDataProvider()
    let c = remult.repo(type)

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    t.success = () => {}
    t.created = () => {}
    let d = new Done()
    await api.post(t, {
      id: 1,
      val: 'noam',
    })
    await api.put(t, 1, {
      val: 'yael',
    })

    var x = await c.find({ where: { id: 1 } })
    expect(x[0].val).toBe('noam')
  })
  it('allow column update based on specific value', async () => {
    let type = class extends EntityBase {
      id: number
      val: string
    }
    Entity('allowcolumnupdatetest', { allowApiCrud: true })(type)
    Fields.integer()(type.prototype, 'id')
    Fields.string<typeof type.prototype>({
      allowApiUpdate: (x, c) => x.val != 'yael',
    })(type.prototype, 'val')
    let remult = new Remult()
    remult.dataProvider = new InMemoryDataProvider()
    let c = remult.repo(type)
    expect(c.fields.val.apiUpdateAllowed({ val: 'yael' })).toBe(false)
    expect(c.fields.val.apiUpdateAllowed({ val: 'yae' })).toBe(true)

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    t.success = () => {}
    t.created = () => {}
    let d = new Done()
    await api.post(t, {
      id: 1,
      val: 'noam',
    })
    await api.put(t, 1, {
      val: 'yael',
    })
    var x = await c.find({ where: { id: 1 } })
    expect(x[0].val).toBe('yael')
    await api.put(t, 1, {
      val: 'yoni',
    })
    var x = await c.find({ where: { id: 1 } })
    expect(x[0].val).toBe('yael')
  })

  it('test value list type', () => {
    let x = ValueListInfo.get(Status)
    expect(x.fieldTypeInDb).toBe('integer')
  })
})

@Entity<CategoriesForThisTest>(undefined, {
  allowApiUpdate: true,
  allowApiInsert: true,

  saving: (t) => {
    if (t.categoryName.indexOf('1') >= 0)
      t._.fields.categoryName.error = 'invalid'
  },
})
class CategoriesForThisTest extends Categories {}

describe('Test validation with exception', () => {
  it('', async () => {
    const repo = new Remult(new InMemoryDataProvider()).repo(
      ExceptionValidation,
    )
    let e = repo.create({ name: 'a', name2: 'b' })
    try {
      await repo.save(e)
    } catch (err: any) {
      const info: ErrorInfo<ExceptionValidation> = err
      expect(info.modelState.name).toBe('say what?')
      expect(getEntityRef(e).fields.name.error).toBe('say what?')
      expect(info.modelState.name2).toBe('say what?2')
      expect(getEntityRef(e).fields.name2.error).toBe('say what?2')
    }
  })
})

@Entity(undefined, {})
export class ExceptionValidation {
  @Fields.number()
  id = 0
  @Fields.string<ExceptionValidation>({
    validate: (self) => {
      if (self.name.length < 5) throw 'say what?'
    },
  })
  name = ''
  @Fields.string<ExceptionValidation>({
    validate: (self) => {
      if (self.name.length < 5) throw new Error('say what?2')
    },
  })
  name2 = ''
}
