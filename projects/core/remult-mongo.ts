import {
  ObjectId,
  type ClientSession,
  type Db,
  type FindOptions,
  type MongoClient,
} from 'mongodb'
import type {
  DataProvider,
  EntityDataProvider,
  EntityDataProviderFindOptions,
  EntityFilter,
  EntityMetadata,
  FieldMetadata,
  Remult,
} from './index.js'
import { Filter } from './index.js'
import type { EntityDbNamesBase } from './src/filter/filter-consumer-bridge-to-sql-request.js'
import {
  dbNamesOf,
  dbNamesOfWithForceSqlExpression,
} from './src/filter/filter-consumer-bridge-to-sql-request.js'
import type { FilterConsumer } from './src/filter/filter-interfaces.js'
import { remult as remultContext } from './src/remult-proxy.js'
import type { RepositoryOverloads } from './src/remult3/RepositoryImplementation.js'
import { getRepository } from './src/remult3/RepositoryImplementation.js'
import { getRepositoryInternals } from './src/remult3/repository-internals.js'
import { getRowAfterUpdate } from './src/data-providers/sql-database.js'
import type { EntityDataProviderGroupByOptions } from './src/data-interfaces.js'
import { GroupByCountMember, GroupByOperators } from './src/remult3/remult3.js'

export class MongoDataProvider implements DataProvider {
  constructor(
    private db: Db,
    private client: MongoClient | undefined,
    options?: { session?: ClientSession; disableTransactions?: boolean },
  ) {
    this.session = options?.session
    this.disableTransactions = Boolean(options?.disableTransactions)
  }
  session?: ClientSession
  disableTransactions = false
  static getDb(dataProvider?: DataProvider) {
    const r = (dataProvider || remultContext.dataProvider) as MongoDataProvider
    if (!r.db) throw 'the data provider is not a MongoDataProvider'
    return { db: r.db, session: r.session }
  }
  async ensureSchema(entities: EntityMetadata[]): Promise<void> {
    for (const entity of entities) {
      const m = new MongoEntityDataProvider(this.db, entity, this.session)
      await m.ensureSchema()
    }
  }
  getEntityDataProvider(entity: EntityMetadata): EntityDataProvider {
    return new MongoEntityDataProvider(this.db, entity, this.session)
  }
  async transaction(
    action: (dataProvider: DataProvider) => Promise<void>,
  ): Promise<void> {
    if (this.disableTransactions) {
      await action(this)
    } else {
      if (!this.client)
        throw new Error("Can't use transactions within transactions")
      let session = await this.client.startSession()

      session.startTransaction()

      const db = this.client.db(this.db.databaseName)
      try {
        await action(new MongoDataProvider(db, undefined, { session }))
        await session.commitTransaction()
      } catch (err) {
        await session.abortTransaction()
        throw err
      } finally {
        await session.endSession()
      }
    }
  }
  static async filterToRaw<entityType>(
    entity: RepositoryOverloads<entityType>,
    condition: EntityFilter<entityType>,
  ) {
    const repo = getRepository(entity)
    var b = new FilterConsumerBridgeToMongo(
      await dbNamesOfWithForceSqlExpression(repo.metadata),
    )
    b._addWhere = false
    await (
      await getRepositoryInternals(repo)._translateWhereToFilter(condition)
    ).__applyToConsumer(b)
    let r = await b.resolveWhere()
    return r
  }
}
const NULL = { $null: '$null' }
function isNull(x: any) {
  return x?.$null === NULL.$null
}
class MongoEntityDataProvider implements EntityDataProvider {
  async ensureSchema() {
    const { collection, e } = await this.collection()
    if (
      !(await this.db.collections()).find(
        (x) => x.collectionName == e.$entityName,
      )
    ) {
      await this.db.createCollection(e.$entityName)
      if (
        this.entity.idMetadata.field &&
        e.$dbNameOf(this.entity.idMetadata.field) != '_id'
      ) {
        const index: any = {}
        for (const f of this.entity.idMetadata.fields) {
          index[e.$dbNameOf(f)] = 1
        }
        try {
          await collection.createIndex(index, { unique: true })
        } catch (err) {
          throw err
        }
      }
    }
  }
  constructor(
    private db: Db,
    private entity: EntityMetadata,
    private session?: ClientSession,
  ) {}

  translateFromDb(
    row: any,
    nameProvider: EntityDbNamesBase,
    select?: string[],
  ) {
    let result: any = {}
    for (const col of this.entity.fields) {
      if (select && !select.includes(col.key)) continue
      let val = row[nameProvider.$dbNameOf(col)]
      if (val === undefined) {
        if (!col.allowNull) {
          if (col.valueType === String) val = ''
        } else val = null
      }
      if (isNull(val)) val = null
      result[col.key] = fromDb(col, val)
    }
    return result
  }
  translateToDb(row: any, nameProvider: EntityDbNamesBase) {
    let result: any = {}
    for (const col of this.entity.fields) {
      let val = toDb(col, row[col.key])
      if (val === null) val = NULL
      result[nameProvider.$dbNameOf(col)] = val
    }
    return result
  }
  async count(where: Filter): Promise<number> {
    const { collection, e } = await this.collection()
    let x = new FilterConsumerBridgeToMongo(e)
    where.__applyToConsumer(x)
    let w = await x.resolveWhere()

    return await collection.countDocuments(w, { session: this.session })
  }
  async groupBy(options?: EntityDataProviderGroupByOptions): Promise<any[]> {
    let { collection, e } = await this.collection()
    let x = new FilterConsumerBridgeToMongo(e)
    const pipeLine: any[] = []
    if (options?.where) {
      options.where.__applyToConsumer(x)
      let where = await x.resolveWhere()
      pipeLine.push({ $match: where })
    }
    const processResultRow: ((mongoRow: any, resultRow: any) => void)[] = []
    const $group: any = {
      __count: { $sum: 1 },
    }
    processResultRow.push((mongoRow, resultRow) => {
      resultRow[GroupByCountMember] = mongoRow.__count
    })
    pipeLine.push({ $group })
    const $addFields: any = {}
    pipeLine.push({ $addFields })

    if (options?.group) {
      $group._id = {}
      for (const element of options.group) {
        const name = e.$dbNameOf(element)
        $group._id[name] = `$${name}`

        processResultRow.push((mongoRow, resultRow) => {
          resultRow[element.key] = element.valueConverter.fromDb(
            mongoRow._id[name],
          )
        })
      }
    } else {
      $group._id = null
    }
    for (const operator of GroupByOperators) {
      if (options?.[operator]) {
        for (const element of options[operator]) {
          const name = e.$dbNameOf(element) + '_' + operator
          if (operator === 'distinctCount') {
            $group[name + '_temp'] = { $addToSet: `$${e.$dbNameOf(element)}` }
            $addFields[name] = { $size: `$${name + '_temp'}` }
          } else $group[name] = { ['$' + operator]: `$${e.$dbNameOf(element)}` }
          processResultRow.push((mongoRow, resultRow) => {
            resultRow[element.key] = {
              ...resultRow[element.key],
              [operator]: mongoRow[name],
            }
          })
        }
      }
    }

    if (options?.orderBy) {
      let sort: any = {}
      for (const x of options.orderBy) {
        const direction = x.isDescending ? -1 : 1
        switch (x.operation) {
          case 'count':
            sort['__count'] = direction
            break
          case undefined:
            sort['_id.' + e.$dbNameOf(x.field!)] = direction
            break
          default:
            sort[e.$dbNameOf(x.field!) + '_' + x.operation] = direction
            break
        }
      }
      pipeLine.push({ $sort: sort })
    }

    if (options?.limit) {
      pipeLine.push({ $limit: options.limit })

      if (options.page) {
        pipeLine.push({ $skip: (options.page - 1) * options.limit })
      }
    }

    const r = await collection
      .aggregate(pipeLine, { session: this.session })
      .toArray()
    const r2 = r.map((x) => {
      let resultRow: any = {}
      for (const f of processResultRow) {
        f(x, resultRow)
      }
      return resultRow
    })
    return r2
  }
  async find(options: EntityDataProviderFindOptions): Promise<any[]> {
    let { collection, e } = await this.collection()
    let x = new FilterConsumerBridgeToMongo(e)
    if (options?.where) options.where.__applyToConsumer(x)
    let where = await x.resolveWhere()
    let op: FindOptions<any> = {
      session: this.session,
    }
    if (options.limit) {
      op.limit = options.limit
      if (options.page) {
        op.skip = (options.page - 1) * options.limit
      }
    }
    if (options.orderBy) {
      op.sort = {}
      for (const s of options.orderBy.Segments) {
        op.sort[e.$dbNameOf(s.field)] = s.isDescending ? -1 : 1
      }
    }
    return await Promise.all(
      await collection
        .find(where, op)
        .map((x) => this.translateFromDb(x, e, options.select))
        .toArray(),
    )
  }
  async update(id: any, data: any): Promise<any> {
    let { collection, e } = await this.collection()
    let f = new FilterConsumerBridgeToMongo(e)
    Filter.fromEntityFilter(
      this.entity,
      this.entity.idMetadata.getIdFilter(id),
    ).__applyToConsumer(f)

    let newR: any = {}
    let keys = Object.keys(data)
    for (const f of this.entity.fields) {
      if (!f.dbReadOnly && !f.isServerExpression) {
        if (keys.includes(f.key)) {
          newR[f.key] = toDb(f, data[f.key])
        }
      }
    }
    let r = await collection.updateOne(
      await f.resolveWhere(),
      {
        $set: newR,
      },
      { session: this.session },
    )
    return getRowAfterUpdate(this.entity, this, data, id, 'update')
  }
  async delete(id: any): Promise<void> {
    const { e, collection } = await this.collection()
    let f = new FilterConsumerBridgeToMongo(e)
    Filter.fromEntityFilter(
      this.entity,
      this.entity.idMetadata.getIdFilter(id),
    ).__applyToConsumer(f)
    await collection.deleteOne(await f.resolveWhere(), {
      session: this.session,
    })
  }
  async insert(data: any): Promise<any> {
    let { collection, e } = await this.collection()
    let r = await collection.insertOne(await this.translateToDb(data, e), {
      session: this.session,
    })
    return await this.translateFromDb(
      await collection.findOne(
        { _id: r.insertedId },
        { session: this.session },
      ),
      e,
    )
  }

  private async collection() {
    const e = await dbNamesOf(this.entity)
    const collection = this.db.collection(e.$entityName)
    return { e, collection }
  }
}

class FilterConsumerBridgeToMongo implements FilterConsumer {
  _addWhere = true
  promises: Promise<void>[] = []
  result = [] as (() => any)[]
  async resolveWhere() {
    while (this.promises.length > 0) {
      let p = this.promises
      this.promises = []
      for (const pr of p) {
        await pr
      }
    }
    if (this.result.length > 0) return { $and: this.result.map((x) => x()) }
    else return {}
  }

  constructor(private nameProvider: EntityDbNamesBase) {}

  custom(key: string, customItem: any): void {
    throw new Error('Custom filter should be translated before it gets here')
  }

  or(orElements: Filter[]) {
    this.promises.push(
      (async () => {
        let result: any[] = []
        for (const element of orElements) {
          let f = new FilterConsumerBridgeToMongo(this.nameProvider)
          f._addWhere = false
          element.__applyToConsumer(f)
          let where = await f.resolveWhere()
          if (where?.$and?.length) {
            result.push(where)
          } else return //since empty or is all rows;
        }
        this.result.push(() => ({
          $or: result,
        }))
      })(),
    )
  }
  not(element: Filter) {
    this.promises.push(
      (async () => {
        let f = new FilterConsumerBridgeToMongo(this.nameProvider)
        f._addWhere = false
        element.__applyToConsumer(f)
        let where = await f.resolveWhere()
        if (where) {
          this.result.push(() => ({
            $nor: [where],
          }))
        }
      })(),
    )
  }
  isNull(col: FieldMetadata): void {
    this.add(col, NULL, '$eq')
  }
  isNotNull(col: FieldMetadata): void {
    this.add(col, NULL, '$ne')
  }
  isIn(col: FieldMetadata, val: any[]): void {
    this.result.push(() => ({
      [this.nameProvider.$dbNameOf(col)]: {
        $in: val.map((x) => toDb(col, x)),
      },
    }))
  }
  isEqualTo(col: FieldMetadata, val: any): void {
    this.add(col, val, '$eq')
  }
  isDifferentFrom(col: FieldMetadata, val: any): void {
    this.add(col, val, '$ne')
  }
  isGreaterOrEqualTo(col: FieldMetadata, val: any): void {
    this.add(col, val, '$gte')
  }
  isGreaterThan(col: FieldMetadata, val: any): void {
    this.add(col, val, '$gt')
  }
  isLessOrEqualTo(col: FieldMetadata, val: any): void {
    this.add(col, val, '$lte')
  }
  isLessThan(col: FieldMetadata, val: any): void {
    this.add(col, val, '$lt')
  }
  public containsCaseInsensitive(col: FieldMetadata, val: any): void {
    this.add(col, val, '$regex', { $options: 'i' })
  }
  public notContainsCaseInsensitive(col: FieldMetadata, val: any): void {
    this.result.push(() => ({
      [this.nameProvider.$dbNameOf(col)]: {
        $not: {
          $regex: isNull(val) ? val : toDb(col, val),
          $options: 'i',
        },
      },
    }))
  }
  public startsWithCaseInsensitive(col: FieldMetadata, val: any): void {
    this.add(col, `^${val}`, '$regex', { $options: 'i' })
  }
  public endsWithCaseInsensitive(col: FieldMetadata, val: any): void {
    this.add(col, `${val}$`, '$regex', { $options: 'i' })
  }

  private add(
    col: FieldMetadata,
    val: any,
    operator: string,
    moreOptions?: any,
  ) {
    this.result.push(() => ({
      [this.nameProvider.$dbNameOf(col)]: {
        [operator]: isNull(val) ? val : toDb(col, val),
        ...moreOptions,
      },
    }))
  }

  databaseCustom(databaseCustom: any): void {
    throw 'error'
    //   this.promises.push((async () => {
    //     if (databaseCustom?.buildSql) {
    //       let item = new CustomSqlFilterBuilder(this.knex);
    //       await databaseCustom.buildSql(item);
    //       if (item.sql) {
    //         this.addToWhere("(" + item.sql + ")");
    //       }
    //     }
    //   })());
  }
}
function toDb(col: FieldMetadata, val: any) {
  if (col.valueConverter.fieldTypeInDb == 'dbid')
    return val ? new ObjectId(val) : val === null ? null : undefined
  return col.valueConverter.toDb(val)
}
function fromDb(col: FieldMetadata, val: any) {
  if (col.valueConverter.fieldTypeInDb == 'dbid')
    return val ? val.toHexString() : val === null ? null : undefined
  return col.valueConverter.fromDb(val)
}
