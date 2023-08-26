import { Remult } from '../context'

import { InMemoryDataProvider } from '../data-providers/in-memory-database'

import { SqlDatabase } from '../data-providers/sql-database'
import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider'
import {
  Field,
  Entity,
  EntityBase,
  ValueListFieldType,
  Fields,
  getValueList,
  ValueListInfo,
  IdEntity,
} from '../remult3'
import { postgresColumnSyntax } from '../../postgres/schema-builder'

import { SqlCommand, SqlResult } from '../sql-command'
import {
  FilterConsumerBridgeToSqlRequest,
  dbNamesOf,
  isDbReadonly,
} from '../filter/filter-consumer-bridge-to-sql-request'
import { describe, it, expect,beforeEach,afterEach,beforeAll } from 'vitest'

describe('test sql database expressions', () => {
  let web = new WebSqlDataProvider('test')
  let db = new SqlDatabase(web)
  let remult = new Remult()
  remult.dataProvider = db
  async function deleteAll() {
    await web.dropTable(remult.repo(testSqlExpression).metadata)
    await web.dropTable(remult.repo(expressionEntity).metadata)
  }
  it('test basics', async () => {
    await deleteAll()
    let x = remult.repo(testSqlExpression).create()
    x.code = 3
    await x._.save()
    expect(x.code).toBe(3)
    expect(x.testExpression).toBe(15, 'after save')
    expect(x._.fields.testExpression.originalValue).toBe(15, 'after save')
    x = await remult.repo(testSqlExpression).findFirst()

    expect(x.testExpression).toBe(15)
  })
  it('test undefined behaves as a column', async () => {
    await deleteAll()
    let x = remult.repo(expressionEntity)
    let n = await dbNamesOf(x.metadata)
    expect(n.col).toBe('col')
    expect((await x.create({ col: 'abc', id: 1 }).save()).col).toBe('abc')
    expect(isDbReadonly(x.metadata.fields.col, n)).toBe(false)
    let c = new Remult()
    c.dataProvider = db
    expressionEntity.yes = true
    x = c.repo(expressionEntity)
    n = await dbNamesOf(x.metadata)
    expect(n.col).toBe("'1+1'")
    expect((await x.create({ col: 'abc', id: 2 }).save()).col).toBe('1+1')
    expect(isDbReadonly(x.metadata.fields.col, n)).toBe(true)
  })
  it('test asyync dbname', async () => {
    let z = await remult.repo(testServerExpression1).metadata.getDbName()
    expect(z).toBe('testServerExpression1')
  })
})
@Entity('expressionEntity')
class expressionEntity extends EntityBase {
  @Fields.integer()
  id: number
  static yes: boolean
  @Fields.string({
    sqlExpression: async () => (expressionEntity.yes ? "'1+1'" : undefined),
  })
  col: string
}

@Entity('testSqlExpression')
class testSqlExpression extends EntityBase {
  @Fields.number()
  code: number
  @Fields.number<testSqlExpression>({
    sqlExpression: async (x) => {
      return (await x.fields.code.getDbName()) + ' * 5'
    },
  })
  testExpression: number
}

@Entity('testServerExpression1', {
  sqlExpression: async () =>
    new Promise((res) =>
      setTimeout(() => {
        res('testServerExpression1')
      }, 30),
    ),
})
class testServerExpression1 extends EntityBase {
  @Fields.number()
  code: number
}
export class myDummySQLCommand implements SqlCommand {
  execute(sql: string): Promise<SqlResult> {
    throw new Error('Method not implemented.')
  }
  addParameterAndReturnSqlToken(val: any): string {
    if (val === null) return 'null'
    if (val instanceof Date) val = val.toISOString()
    if (typeof val == 'string') {
      return "'" + val.replace(/'/g, "''") + "'"
    }
    return val.toString()
  }
}
describe('test filter for date', () => {
  it('filter', async () => {
    let c = new Remult()
    let e = c.repo(testCreate)
    var d = new myDummySQLCommand()
    var db = await dbNamesOf(e.metadata)
    let f = new FilterConsumerBridgeToSqlRequest(d, db)
    f.isGreaterOrEqualTo(
      e.metadata.fields.theDate,
      new Date('2021-08-06T05:05:25.440Z'),
    )

    expect(await f.resolveWhere()).toBe(
      " where theDate >= '" + new Date(2021, 7, 6).toISOString() + "'",
    )
  })
})

describe('Postgres create db', () => {
  let c = new Remult()
  it('what', () => {
    let e = c.repo(testCreate)
    expect(postgresColumnSyntax(e.metadata.fields.theDate, 'x')).toBe('x date')
    expect(postgresColumnSyntax(e.metadata.fields.i, 'x')).toBe(
      'x integer default 0 not null',
    )
    expect(postgresColumnSyntax(e.metadata.fields.s, 'x')).toBe(
      "x varchar default '' not null",
      's',
    )
    expect(postgresColumnSyntax(e.metadata.fields.s2, 'x')).toBe(
      "x varchar default '' not null",
      's2',
    )
  })
})

@ValueListFieldType()
class intId {
  static z = new intId(0, '')
  constructor(
    public id: number,
    public caption: string,
  ) {}
}
@ValueListFieldType()
class stringId {
  static z = new stringId('0', '')
  constructor(
    public id: string,
    public caption: string,
  ) {}
}
@ValueListFieldType()
class stringId2 {
  static z = new stringId2()
  constructor(
    public id?: string,
    public caption?: string,
  ) {}
}
@Entity('testCreate')
class testCreate extends IdEntity {
  @Fields.dateOnly()
  theDate: Date
  @Field(() => intId)
  i: intId
  @Field(() => stringId)
  s: stringId
  @Field(() => stringId2)
  s2: stringId2
}

@ValueListFieldType({
  getValues: () => [new missingCaption('abc')],
})
class missingCaption {
  constructor(public id: string) {}
  caption!: string
}

@ValueListFieldType()
class missingCaption2 {
  static item = new missingCaption2('abc')
  constructor(
    public id: string,
    public caption?: string,
  ) {}
}

describe('Test Value List Items', () => {
  it('require id', () => {
    try {
      const missingId = class {}
      ValueListFieldType({
        getValues: () => [new missingId()],
      })(missingId)
      getValueList(missingId)
      expect(true).toBe(
        false,
        "should have failed and not reached this since it's missing an id",
      )
    } catch {}
  })
  it('getValuesWorks Early', () => {
    expect(getValueList(missingCaption).length).toBe(1)
  })

  it('caption is auto generated', () => {
    expect(getValueList(missingCaption)[0].caption).toBe('Abc')
  })
  it('test caption 2', () => {
    expect(getValueList(missingCaption2)[0].caption).toBe('Abc')
  })
  it('find by id', () => {
    expect(ValueListInfo.get(missingCaption).byId('abc').caption).toBe('Abc')
  })
})
