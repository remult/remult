import { ArrayEntityDataProvider } from '../../core/src//data-providers/array-entity-data-provider'
import { InMemoryDataProvider } from '../../core/src//data-providers/in-memory-database'
import type {
  FieldMetadata,
  FieldOptions,
  ValueConverter,
} from '../../core/src/column-interfaces'
import { Allow, Remult } from '../../core/src/context'

import { describe, expect, it } from 'vitest'
import {
  dbNamesOf,
  FilterConsumerBridgeToSqlRequest,
} from '../../core/src/filter/filter-consumer-bridge-to-sql-request'
import { Validators } from '../../core/src/validators'

import type { EntityMetadata, FindOptions } from '../../core'
import { describeClass, EntityBase, Sort } from '../../core/'
import {
  Entity,
  Entity as EntityDecorator,
  getEntityRef,
  Field,
  Fields,
  getValueList,
  ValueListFieldType,
  ValueListInfo,
} from '../../core'
import { ValueConverters } from '../../core/src/valueConverters'
import { Categories, Categories as newCategories } from './remult-3-entities'

import type { ClassType } from '../../core/classType'
import {
  entityFilterToJson,
  Filter,
} from '../../core/src/filter/filter-interfaces'
import { createData } from './createData'
import { decorateColumnSettings } from '../../core/src/remult3/RepositoryImplementation'
import { insertFourRows, Language } from './entities-for-tests.js'

describe('grid filter stuff', () => {
  it('filter with contains', async () => {
    let x = new FilterConsumerBridgeToSqlRequest(
      {
        addParameterAndReturnSqlToken: () => '',
        param: () => '',
      },
      {
        $entityName: '',
        $dbNameOf: () => 'col',
        wrapIdentifier: (x) => x,
      },
    )

    x.containsCaseInsensitive(new mockColumnDefs('col'), "no'am")
    expect(await x.resolveWhere()).toBe(
      " where lower (col) like lower ('%no''am%')",
    )
  })
  it('filter with contains', async () => {
    let x = new FilterConsumerBridgeToSqlRequest(
      {
        addParameterAndReturnSqlToken: () => '',
        param: () => '',
      },
      {
        $entityName: '',
        $dbNameOf: () => 'col',
        wrapIdentifier: (x) => x,
      },
    )

    x.containsCaseInsensitive(new mockColumnDefs('col'), "no'a'm")
    expect(await x.resolveWhere()).toBe(
      " where lower (col) like lower ('%no''a''m%')",
    )
  })

  it('test in statement', async () => {
    let [c] = await insertFourRows()
    expect(await c.count({ id: [1, 3] })).toBe(2)
  })
})

describe('Closed List  column', () => {
  it('Basic Operations', () => {
    let x = ValueListInfo.get(Language)

    expect(x.fromJson(0)).toBe(Language.Hebrew)
    expect(x.toJson(Language.Russian)).toBe(10)

    expect(ValueListInfo.get(Language).getValues().length).toBe(3)
  })

  it('test auto caption', () => {
    let val = ValueListInfo.get(valueList)
    expect(valueList.firstName.caption).toBe('First Name')
    expect(valueList.firstName.label).toBe('First Name')
  })
  it('test with entity', async () => {
    let c = new Remult().repo(entityWithValueList, new InMemoryDataProvider())
    let e = c.create()
    e.id = 1
    expect(e.l).toBe(Language.Hebrew)
    e.l = Language.Russian
    await e._.save()
    e = (await c.findFirst())!

    expect(e.l).toBe(Language.Russian)
    expect(e._.toApiJson().l).toBe(10)
    e.l = {
      id: 99,
      caption: 'bla',
    }
    await expect(() => e.save()).rejects.toMatchObject({
      message: 'L: Value must be one of: 0, 10, 20',
      modelState: {
        l: 'Value must be one of: 0, 10, 20',
      },
    })
  })
  it('test with validation', async () => {
    let c = new Remult().repo(entityWithValueList, new InMemoryDataProvider())
    let e = c.create()

    e.l = {
      ...Language.Russian,
    }
    expect((await e.save()).l).toBe(Language.Russian)
  })
  it('test with entity and data defined on type', async () => {
    let c = new Remult().repo(entityWithValueList, new InMemoryDataProvider())
    let e = c.create()
    e.id = 1
    expect(c.metadata.fields.v.valueType).toBe(valueList)
    expect(c.metadata.fields.v.valueConverter.fromJson('listName')).toBe(
      valueList.listName,
    )
    expect(c.metadata.fields.id.valueType).toBe(Number)
    expect(e.v).toBe(valueList.firstName)

    e.v = valueList.listName
    await e._.save()
    e = (await c.findFirst())!
    expect(e.v).toBe(valueList.listName)
    expect(e._.toApiJson().v).toBe('listName')
  })
  it('test entity with value list get values', () => {
    var x = new Remult().repo(entityWithValueList)
    expect(getValueList(x.metadata.fields.l).length).toBe(3)
    expect(getValueList(x.create().$.l).length).toBe(3)
  })
})

@ValueListFieldType()
class valueList {
  static firstName = new valueList()
  static listName = new valueList()
  constructor(
    public id?: string,
    public caption?: string,
    public label?: string,
  ) {}
}

@Entity('entity with value list')
class entityWithValueList extends EntityBase {
  @Fields.integer()
  id: number = 0
  @Field(() => Language)
  l: Language = Language.Hebrew
  @Field(() => valueList)
  v: valueList = valueList.firstName
}

describe('test row provider', () => {
  it('auto name', () => {
    var cat = new Remult().repo(newCategories).create()
    expect(cat._.repository.metadata.key).toBe('Categories')
  })

  it('test update', async () => {
    let [c] = await createData(async (insert) => await insert(5, 'noam'))
    let r = await c.find()
    expect(r[0].categoryName).toBe('noam')
    r[0].categoryName = 'yael'
    await r[0]._.save()
    r = await c.find()
    expect(r[0].categoryName).toBe('yael')
  })

  it('test filter', async () => {
    let [c] = await insertFourRows()

    let rows = await c.find()
    expect(rows.length).toBe(4)
    rows = await c.find({ where: { description: 'x' } })
    expect(rows.length).toBe(2)
    rows = await c.find({ where: { id: 4 } })
    expect(rows.length).toBe(1)
    expect(rows[0].categoryName).toBe('yael')
    rows = await c.find({ where: { description: 'y', categoryName: 'yoni' } })
    expect(rows.length).toBe(1)
    expect(rows[0].id).toBe(2)
    rows = await c.find({
      where: { description: 'y', categoryName: 'yoni' },
    })
    expect(rows.length).toBe(1)
    expect(rows[0].id).toBe(2)
    rows = await c.find({
      where: { description: 'y', categoryName: 'yoni' },
    })
    expect(rows.length).toBe(1)
    expect(rows[0].id).toBe(2)
  })

  it('test in filter packer', async () => {
    let [r] = await insertFourRows()
    let rows = await r.find()
    expect(rows.length).toBe(4)

    rows = await r.find({
      where: Filter.entityFilterFromJson(
        r.metadata,
        entityFilterToJson(r.metadata, { description: 'x' }),
      ),
    })
    rows = await r.find({
      where: Filter.entityFilterFromJson(
        r.metadata,
        entityFilterToJson(r.metadata, { id: [1, 3] }),
      ),
    })
    expect(rows.length).toBe(2)
    rows = await r.find({
      where: Filter.entityFilterFromJson(
        r.metadata,
        entityFilterToJson(r.metadata, { id: { $ne: [1, 2, 3] } }),
      ),
    })
    expect(rows.length).toBe(1)
  })
  it('sort', async () => {
    let [c] = await insertFourRows()
    let rows = await c.find({ orderBy: { id: 'asc' } })
    expect(rows[0].id).toBe(1)
    expect(rows[1].id).toBe(2)
    expect(rows[2].id).toBe(3)
    expect(rows[3].id).toBe(4)

    rows = await c.find({
      orderBy: { categoryName: 'desc' },
    })
    expect(rows[0].id).toBe(2)
    expect(rows[1].id).toBe(4)
    expect(rows[2].id).toBe(1)
    expect(rows[3].id).toBe(3)
  })
  it('counts', async () => {
    let [c] = await insertFourRows()
    let count = await c.count()
    expect(count).toBe(4)
  })
  it('counts with filter', async () => {
    let [c] = await insertFourRows()
    let count = await c.count({ id: { '<=': 2 } })
    expect(count).toBe(2)
  })

  it('Test Validation 2', async () => {
    var remult = new Remult()
    remult.dataProvider = new InMemoryDataProvider()
    let type = class extends newCategories {
      a!: string
    }
    EntityDecorator('')(type)
    Fields.string<typeof type.prototype>({
      validate: (entity, col) => Validators.required('m')(entity, col),
    })(type.prototype, 'a')
    var c = remult.repo(type)
    var cat = c.create()
    cat.a = ''
    var saved = false
    try {
      await cat._.save()
      saved = true
    } catch (err) {
      expect(cat._.fields.a.error).toEqual('m')
      expect(cat._.error).toBe('A: m')
    }
    expect(saved).toBe(false)
  })
  it('Test Validation 2_1', async () => {
    var remult = new Remult()
    remult.dataProvider = new InMemoryDataProvider()
    let type = class extends newCategories {
      a!: string
    }
    EntityDecorator('')(type)
    Fields.string<typeof type.prototype>({
      validate: (entity, col) => {
        if (!entity.a || entity.a.length == 0) col.error = 'm'
      },
    })(type.prototype, 'a')
    var c = remult.repo(type)
    var cat = c.create()
    cat.a = ''
    var saved = false
    try {
      await cat._.save()
      saved = true
    } catch (err) {
      expect(cat._.fields.a.error).toEqual('m')
    }
    expect(saved).toBe(false)
  })
  it('Test Validation 3', async () => {
    var remult = new Remult()
    remult.dataProvider = new InMemoryDataProvider()
    let type = class extends newCategories {
      a!: string
    }
    EntityDecorator('')(type)
    Fields.string({
      validate: Validators.required.withMessage('m'),
    })(type.prototype, 'a')
    var c = remult.repo(type)
    var cat = c.create()
    cat.a = ''
    var saved = false
    try {
      await cat._.save()
      saved = true
    } catch (err: any) {
      expect(cat._.fields.a.error).toEqual('m')
      expect(err.message).toBe('A: m')
    }
    expect(saved).toBe(false)
  })

  it('Test unique Validation and is not empty', async () => {
    var remult = new Remult()
    remult.dataProvider = new InMemoryDataProvider()
    let type = class extends newCategories {
      a!: string
    }
    EntityDecorator('asdfa')(type)
    Fields.string<typeof type.prototype>({
      validate: [Validators.required, Validators.unique],
    })(type.prototype, 'a')
    var c = remult.repo(type)
    var cat = c.create()
    var saved = false
    cat.a = ''
    try {
      await cat._.save()
      saved = true
    } catch {
      expect(cat._.fields.a.error).toEqual('Should not be empty')
      cat.a = '12'
      await cat._.save()
    }
    expect(saved).toBe(false)
    cat = c.create()
    cat.a = '12'

    try {
      await cat._.save()
      saved = true
    } catch (err) {
      expect(cat._.fields.a.error).toEqual('already exists')
    }
    expect(saved).toBe(false)
  })

  it('test that it fails nicely', async () => {
    let c = (await insertFourRows())[0].create()
    c.id = 1
    c.categoryName = 'bla bla'
    try {
      await c._.save()
      throw 'Shouldnt have reached this'
    } catch (err) {}
    expect(c.categoryName).toBe('bla bla')
  })
  it('update should fail nicely', async () => {
    let cont = new Remult()
    cont.dataProvider = {
      getEntityDataProvider: (x) => new myDp(x),
      transaction: undefined!,
    }
    let c = cont.repo(newCategories).create()
    c.id = 1
    c.categoryName = 'noam'
    await cont.repo(newCategories).save(c)
    c.categoryName = 'yael'
    try {
      await cont.repo(newCategories).save(c)
      throw 'shouldnt be here'
    } catch (err) {
      expect(c.categoryName).toBe('yael')
    }
  })
  it('filter should return none', async () => {
    let [c] = await insertFourRows()
    let r = (await c.findFirst(
      { categoryName: [] },
      { createIfNotFound: true },
    ))!
    expect(r.categoryName).toBe(undefined)
    expect(r.isNew()).toBe(true)
  })
  it('filter ignore works return none', async () => {
    let [c] = await insertFourRows()
    let r = (await c.findFirst(
      { categoryName: undefined },
      { createIfNotFound: true },
    ))!
    expect(r.categoryName).toBe('noam')
    expect(r.isNew()).toBe(false)
  })

  it("lookup survives row that doesn't exist", async () => {
    let [c] = await createData(async (insert) => await insert(1, 'noam'))
    let r = await c.findId(5)
    expect(r).toBeUndefined()
    r = await c.findId(5)
    expect(r).toBeUndefined()
  })
})

@Entity('typeA', { dbName: 'dbnameA' })
class typeA extends EntityBase {}
@Entity('typeB')
class typeB extends typeA {}
describe('decorator inheritance', () => {
  it('entity extends', async () => {
    let c = new Remult()
    let defsA = c.repo(typeA).metadata
    expect(defsA.key).toBe('typeA')
    expect((await dbNamesOf(defsA)).$entityName).toBe('dbnameA')
    let defsB = c.repo(typeB).metadata
    expect(defsB.key).toBe('typeB')
    expect((await dbNamesOf(defsB)).$entityName).toBe('dbnameA')
  })
})
describe('order by api', () => {
  it('works with sort', () => {
    let c = new Remult().repo(Categories)
    let opt: FindOptions<Categories> = { orderBy: { id: 'asc' } }
    let s = Sort.translateOrderByToSort(c.metadata, opt.orderBy!)
    expect(s.Segments.length).toBe(1)
    expect(s.Segments[0].field.key).toBe(c.metadata.fields.id.key)
  })

  it('works with columns array', () => {
    let c = new Remult().repo(Categories)
    let opt: FindOptions<Categories> = {
      orderBy: {
        id: 'asc',
        categoryName: 'asc',
      },
    }
    let s = Sort.translateOrderByToSort(c.metadata, opt.orderBy!)
    expect(s.Segments.length).toBe(2)
    expect(s.Segments[0].field).toBe(c.metadata.fields.id)
    expect(s.Segments[1].field).toBe(c.metadata.fields.categoryName)
  })

  it('test several sort options', async () => {
    let [c] = await createData(async (i) => {
      await i(1, 'z')
      await i(2, 'y')
    })

    let r = await c.find({ orderBy: { categoryName: 'asc' } })
    expect(r.length).toBe(2)
    expect(r[0].id).toBe(2)

    r = await c.find({ orderBy: { categoryName: 'asc' } })
    expect(r.length).toBe(2)
    expect(r[0].id).toBe(2)

    r = await c.find({ orderBy: { categoryName: 'desc' } })
    expect(r.length).toBe(2)
    expect(r[0].id).toBe(1)
  })
})
describe('test number column', () => {
  it('fromInput null', () => {
    expect(ValueConverters.Number.fromInput!(null!)).toBe(null)
  })
  it('fromInput undefined', () => {
    expect(ValueConverters.Number.fromInput!(undefined!)).toBe(undefined)
  })
  it('fromInput 1', () => {
    expect(ValueConverters.Number.fromInput!('7.11')).toBe(7.11)
  })
})
describe('test datetime column', () => {
  it('stores well', () => {
    let col = decorateColumnSettings<Date>({ valueType: Date }, new Remult())
    let val = col.valueConverter!.fromJson!(
      col.valueConverter!.toJson!(new Date(1976, 11, 16, 8, 55, 31, 65)),
    )
    expect(val!.toISOString()).toBe(
      new Date(1976, 11, 16, 8, 55, 31, 65).toISOString(),
    )
  })
  it('stores well undefined', () => {
    let col = decorateColumnSettings<Date>({ valueType: Date }, new Remult())
    expect(col.valueConverter!.toJson!(undefined!)).toBe('')
  })
  it('displays empty date well', () => {
    expect(
      ValueConverters.DateOnly.displayValue!(
        ValueConverters.DateOnly.fromJson!(''),
      ),
    ).toBe('')
  })
  it('displays null date well 1', () => {
    expect(ValueConverters.DateOnly.toJson!(null!)).toBe(null)
    expect(ValueConverters.DateOnly.toJson!(null!)).toBe(null)
    expect(ValueConverters.DateOnly.displayValue!(null!)).toBe('')
  })
  it('displays empty date well empty', () => {
    expect(
      ValueConverters.DateOnly.displayValue!(
        ValueConverters.DateOnly.fromJson!('0000-00-00'),
      ),
    ).toBe('')
  })
  it('Date only stuff', () => {
    function test(d: Date, expected: string) {
      expect(ValueConverters.DateOnly.toJson!(d)).toBe(expected)
      const ed = ValueConverters.DateOnly.fromJson!(expected)!
      expect(ed.getFullYear()).to.eq(d.getFullYear(), 'year')
      expect(ed.getMonth()).to.eq(d.getMonth(), 'month')
      expect(ed.getDate()).to.eq(d.getDate(), 'day')
    }
    test(new Date(2021, 2, 26), '2021-03-26')
    test(new Date(2021, 9, 31), '2021-10-31')
    //test(new Date('1976-06-16'), '1976-06-16');
    //test(new Date('1976-6-16'), '1976-06-16');
    test(new Date(1976, 5, 16), '1976-06-16')
    test(new Date(2021, 9, 30), '2021-10-30')
    test(new Date(2021, 2, 26), '2021-03-26')
    ''.toString()
  })
  it('test display value, from and to input', () => {
    let x = class {
      name = 'noam'
      myDate = new Date(1976, 5, 16)
      num = 7
    }

    describeClass(x, Entity('myEntity'), {
      name: Fields.string(),
      myDate: Fields.dateOnly<InstanceType<typeof x>>({
        displayValue: (z) => z.name + z.myDate.getFullYear(),
      }),
      num: Fields.number(),
    })
    var repo = new Remult().repo(x)
    let y: InstanceType<typeof x> = {
      name: 'noam',
      myDate: new Date(1976, 5, 16),
      num: 0,
    }
    expect(repo.fields.myDate.displayValue(y)).toBe('noam1976')
    expect(repo.fields.myDate.toInput(new Date(1976, 5, 16))).toBe('1976-06-16')
    expect(repo.fields.myDate.fromInput('1976-06-16')).toEqual(
      new Date(1976, 5, 16),
    )
    // @ts-expect-error first arg should be a string,
    // but in case we pass the value of html <input />, it can be a number already
    expect(repo.fields.num.fromInput(0, 'number')).toEqual(0)
  })

  it('date Storage works 1', () => {
    let col = decorateColumnSettings<Date>(
      {
        valueType: Date,
        valueConverter: ValueConverters.DateOnly,
      },
      new Remult(),
    )
    expect(
      col.valueConverter!.toDb!(
        col.valueConverter!.fromJson!('1976-06-16'),
      ).toLocaleDateString(),
    ).toBe(new Date(1976, 5, 16, 0, 0, 0).toLocaleDateString())
    expect(
      col.valueConverter!.toDb!(
        col.valueConverter!.fromJson!('1976-06-16'),
      ).getDate(),
    ).toBe(16)
  })
})

describe('Test char date storage', () => {
  let x = ValueConverters.DateOnlyString
  it('from db', () => {
    expect(x.fromDb!('00000000')).toEqual(
      ValueConverters.DateOnlyString.zeroDate,
    )
  })
  it('to db', () => {
    expect(x.toDb!(ValueConverters.DateOnlyString.zeroDate)).toBe('00000000')
  })
  it('from db', () => {
    expect(x.toJson!(x.fromDb!('19760616'))).toBe('1976-06-16')
  })
  it('to json', () => {
    expect(
      x.toJson!(ValueConverters.DateOnlyString.zeroDate),
    ).toMatchInlineSnapshot(`"0000-01-01"`)
  })
  it('from json', () => {
    expect(x.fromJson!('0000-01-01')).toEqual(
      ValueConverters.DateOnlyString.zeroDate,
    )
  })
  it('to db', () => {
    expect(x.toDb!(x.fromJson!('1976-06-16'))).toBe('19760616')
  })
  it('returns valid date', () => {
    expect(x.fromDb!('19760616')).toEqual(new Date(1976, 5, 16))
  })
  it('returns valid date', () => {
    const d = x.fromDb!('19760616')
    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(0)
    expect(d.getSeconds()).toBe(0)
    expect(d.getMilliseconds()).toBe(0)
    expect(d.getMonth()).toBe(5)
    expect(d.getDate()).toBe(16)
    expect(d.getFullYear()).toBe(1976)
  })
  it('export todb of extremes to be valid', () => {
    expect(x.toDb!(new Date(1976, 5, 16, 23, 59, 59, 999))).toBe('19760616')
    expect(x.toDb!(new Date(1976, 5, 16, 0, 0, 0, 0))).toBe('19760616')
    expect(x.toDb!(new Date(1976, 5, 16, 0, 0, 0, 1))).toBe('19760616')
  })
  it('export toJson of extremes to be valid', () => {
    expect(x.toJson!(new Date(1976, 5, 16, 23, 59, 59, 999))).toBe('1976-06-16')
    expect(x.toJson!(new Date(1976, 5, 16, 0, 0, 0, 0))).toBe('1976-06-16')
    expect(x.toJson!(new Date(1976, 5, 16, 0, 0, 0, 1))).toBe('1976-06-16')
  })

  it('expect date stored ok', () => {
    expect(x.toDb!(new Date(1976, 5, 16))).toBe('19760616')
  })
  it('expect date to be date', () => {
    expect(new Date(1976, 5, 16).getHours()).toBe(0)
  })
})

describe('value list column without id and caption', () => {
  it('getValueList', () => {
    expect(getValueList(Language).length).toBe(3)
  })
})

describe('context', () => {
  it('what', () => {
    var c = new Remult()
    expect(c.authenticated()).toBe(false)

    c.user = {
      id: '1',
      name: 'name',
      roles: ['a'],
    }
    expect(c.authenticated()).toBe(true)
    c.user = undefined
    expect(c.authenticated()).toBe(false)
  })

  it('is allowed for instance works with array', () => {
    var remult = new Remult()
    remult.user = { roles: ['a'], id: '', name: '' }
    expect(remult.isAllowedForInstance({}, ['b', 'a'])).toBe(true)
  })

  it('test no user is not allowed', () => {
    var remult = new Remult()
    remult.user = undefined
    expect(remult.user).toBeUndefined()
  })
})
it('test http provider for remult', async () => {
  var remult = new Remult({
    get: async (url) => {
      return { count: 7 }
    },
    delete: async () => {},
    put: async () => {},
    post: async () => {},
  })
  // expect(await toPromise(Promise.resolve(7))).toBe(7);
  expect(await remult.repo(TestCategories1).count()).toBe(7)
})

describe('allow', () => {
  it('should work', () => {
    expect(Allow.everyone()).toBe(true)
    var remult = new Remult()
    expect(Allow.authenticated(remult)).toBe(false)
    remult.user = { id: '', name: '', roles: [] }
    expect(Allow.authenticated(remult)).toBe(true)
  })
})

@EntityDecorator<TestCategories1>('123')
class TestCategories1 extends newCategories {
  @Fields.string({
    validate: Validators.required,
  })
  a!: string
}
describe('test ', () => {
  it('Test Validation,', async () => {
    var remult = new Remult()
    remult.dataProvider = new InMemoryDataProvider()

    var c = remult.repo(TestCategories1)
    var cat = c.create()
    cat.a = ''
    var saved = false
    try {
      await c.save(cat)
      saved = true
    } catch (err) {
      expect(getEntityRef(cat).fields.a.error).toEqual('Should not be empty')
    }
    expect(saved).toBe(false)
  })
})
it('test that entity inheritance works well and build', () => {
  class HelperBase extends EntityBase {
    id = ''
  }

  class Helper extends HelperBase {
    name = ''
  }

  let z = new Helper()
  z.id = '123'
  z.name = '123'
  let x1: HelperBase = z
  expect(x1.id).toBe('123')
})

export class myDp extends ArrayEntityDataProvider {
  constructor(entity: EntityMetadata, rows = []) {
    super(entity, () => rows)
  }
  public update(id: any, data: any): Promise<any> {
    throw new Error('what')
  }
}

class mockColumnDefs implements FieldMetadata {
  constructor(public dbName: string) {}
  apiUpdateAllowed(item: any): boolean {
    throw new Error('Method not implemented.')
  }
  displayValue(item: any): string {
    throw new Error('Method not implemented.')
  }
  includedInApi(item: any): boolean {
    throw new Error('Method not implemented.')
  }
  toInput(value: any, inputType?: string): string {
    throw new Error('Method not implemented.')
  }
  fromInput(inputValue: string, inputType?: string) {
    throw new Error('Method not implemented.')
  }
  async getDbName(): Promise<string> {
    return this.dbName
  }
  options!: FieldOptions<unknown, unknown>
  valueConverter: Required<ValueConverter<any>> = ValueConverters.Default
  target!: ClassType<any>
  readonly = false
  readonly dbReadOnly = false
  readonly isServerExpression = false
  readonly key = ''
  readonly label = ''
  readonly caption = ''
  readonly inputType = ''

  readonly valueType: any
  readonly allowNull = false
  readonly dbType = ''
}
