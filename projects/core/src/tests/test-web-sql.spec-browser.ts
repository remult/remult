

import { Remult } from '../context'
import { SqlDatabase } from '../data-providers/sql-database'

import { dbNamesOf } from '../filter/filter-consumer-bridge-to-sql-request'
import { entityForrawFilter } from './entityForCustomFilter'
import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider'
import { describe, it, expect, beforeEach, beforeAll, afterEach } from 'vitest'
import { Categories, CompoundIdEntity, Products, Suppliers } from './entities-for-tests'
import { Entity, EntityBase, Fields } from '../remult3'
import { CompoundIdField } from '../column'

it('test that it works with sql', async () => {
  let w = new WebSqlDataProvider('testWithFilter')

  let c = new Remult().repo(entityForrawFilter, new SqlDatabase(w))
  await w.dropTable(c.metadata)
  for (let id = 0; id < 5; id++) {
    await c.create({ id }).save()
  }
  const e = await dbNamesOf(c.metadata)
  expect(
    await c.count(
      SqlDatabase.rawFilter(
        async (x) =>
          (x.sql =
            e.id +
            ' in (' +
            x.addParameterAndReturnSqlToken(1) +
            ',' +
            x.addParameterAndReturnSqlToken(3, c.metadata.fields.id) +
            ')'),
      ),
    ),
  ).toBe(2)
  expect(await c.count(entityForrawFilter.filter({ dbOneOrThree: true }))).toBe(
    2,
  )
})

it('test relation in sql', async () => {
  var wsql = new WebSqlDataProvider('test2')
  let db = new SqlDatabase(wsql)
  let remult = new Remult()
  remult.dataProvider = db
  for (const x of [Categories, Products, Suppliers] as any[]) {
    let e = remult.repo(x).metadata
    await wsql.dropTable(e)
    await wsql.createTable(e)
  }
  let cat = await remult
    .repo(Categories)
    .create({ id: 1, name: 'cat' })
    .save()
  let sup = await remult
    .repo(Suppliers)
    .create({ supplierId: 'sup1', name: 'sup1name' })
    .save()
  let p = await remult
    .repo(Products)
    .create({
      id: 10,
      name: 'prod',
      category: cat,
      supplier: sup,
    })
    .save()
  await p.$.category.load()
  expect(p.category.id).toBe(cat.id)
  let sqlr = (await db.execute('select category,supplier from products'))
    .rows[0]
  expect(sqlr.category).toEqual('1.0')
  expect(sqlr.supplier).toBe('sup1')
  expect(await remult.repo(Products).count({ supplier: sup })).toBe(1)
  expect(await remult.repo(Products).count({ supplier: [sup] })).toBe(1)
})

it('test date filter and values', async () => {
  let sql = new SqlDatabase(new WebSqlDataProvider('identity_game'))
  let c = new Remult(sql)
  await sql.execute('drop table if exists t1')
  c.dataProvider = sql
  let type = class extends EntityBase {
    id: number
    name: string
    c3: Date
  }
  Entity('t1')(type)
  Fields.autoIncrement()(type.prototype, 'id')
  Fields.string()(type.prototype, 'name')
  Fields.date()(type.prototype, 'c3')

  let f = c.repo(type)
  let d = new Date(2020, 1, 2, 3, 4, 5, 6)
  let p = f.create()
  p.name = '1'
  p.c3 = d
  await p._.save()
  await f.create({ name: '2', c3: new Date(2021) }).save()
  p = await f.findFirst({ c3: d })
  p = await f.findFirst({ c3: d })
  f.findFirst({ c3: d })
  expect(p.name).toBe('1')
  p = await f.findFirst({ c3: { $ne: d } })
  expect(p.name).toBe('2')
  p = await f.findFirst({ c3: { '!=': d } })
  expect(p.name).toBe('2')
})
describe('test web sql identity', () => {
  it('play', async () => {
    let sql = new SqlDatabase(new WebSqlDataProvider('identity_game'))
    let c = new Remult(sql)
    await sql.execute('drop table if exists t1')
    c.dataProvider = sql

    let type = class extends EntityBase {
      id: number
      name: string
    }
    Entity('t1')(type)
    Fields.autoIncrement()(type.prototype, 'id')
    Fields.string()(type.prototype, 'name')

    let f = c.repo(type)
    let t = f.create()
    t.name = 'a'
    await t._.save()
    expect(t.id).toBe(1)
    t = f.create()
    t.name = 'b'
    await t._.save()
    expect(t.id).toBe(2)
  })
})
it('compound sql', async () => {
  let sql = new SqlDatabase(new WebSqlDataProvider('compound'))
  let ctx = new Remult()
  ctx.dataProvider = sql

  let cod = ctx.repo(CompoundIdEntity)
  for (const od of await cod.find({ where: { a: 99 } })) {
    await od._.delete()
  }
  let od = cod.create()
  od.a = 99
  od.b = 1
  await od._.save()
  od = await cod.findFirst({ a: 99 })
  od.c = 5
  await od._.save()
  await od._.delete()
})
