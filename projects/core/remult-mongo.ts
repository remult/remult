import type { MongoClient, Db, FindOptions, ClientSession } from 'mongodb'
import {
  CompoundIdField,
  DataProvider,
  EntityDataProvider,
  EntityDataProviderFindOptions,
  EntityFilter,
  EntityMetadata,
  FieldMetadata,
  Filter,
  Remult,
  Repository,
} from '.'
import {
  EntityDbNames,
  dbNamesOf,
  EntityDbNamesBase,
} from './src/filter/filter-consumer-bridge-to-sql-request'
import { FilterConsumer } from './src/filter/filter-interfaces'
import {
  getRepository,
  RepositoryImplementation,
  RepositoryOverloads,
} from './src/remult3'
import { remult as remultContext } from './src/remult-proxy'

export class MongoDataProvider implements DataProvider {
  constructor(
    private db: Db,
    private client: MongoClient,
    options?: { session?: ClientSession; disableTransactions?: boolean },
  ) {
    this.session = options?.session
    this.disableTransactions = options?.disableTransactions
  }
  session?: ClientSession
  disableTransactions = false
  static getDb(remult?: Remult) {
    const r = (remult || remultContext).dataProvider as MongoDataProvider
    if (!r.db) throw 'the data provider is not a MongoDataProvider'
    return { db: r.db, session: r.session }
  }
  getEntityDataProvider(entity: EntityMetadata<any>): EntityDataProvider {
    return new MongoEntityDataProvider(this.db, entity, this.session)
  }
  async transaction(
    action: (dataProvider: DataProvider) => Promise<void>,
  ): Promise<void> {
    if (this.disableTransactions) {
      await action(this)
    } else {
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
    var b = new FilterConsumerBridgeToMongo(await dbNamesOf(repo.metadata))
    b._addWhere = false
    await (
      await (
        repo as RepositoryImplementation<entityType>
      ).translateWhereToFilter(condition)
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
  constructor(
    private db: Db,
    private entity: EntityMetadata<any>,
    private session?: ClientSession,
  ) {}
  translateFromDb(row: any, nameProvider: EntityDbNamesBase) {
    let result = {}
    for (const col of this.entity.fields) {
      let val = row[nameProvider.$dbNameOf(col)]
      if (isNull(val)) val = null
      result[col.key] = col.valueConverter.fromDb(val)
    }
    return result
  }
  translateToDb(row: any, nameProvider: EntityDbNamesBase) {
    let result = {}
    for (const col of this.entity.fields) {
      let val = col.valueConverter.toDb(row[col.key])
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
  async find(options?: EntityDataProviderFindOptions): Promise<any[]> {
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
        .map((x) => this.translateFromDb(x, e))
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
    let resultFilter = this.entity.idMetadata.getIdFilter(id)
    if (data.id != undefined)
      resultFilter = this.entity.idMetadata.getIdFilter(data.id)
    for (const x of this.entity.fields) {
      if (x instanceof CompoundIdField) {
        resultFilter = x.resultIdFilter(id, data)
      }
    }
    let newR = {}
    let keys = Object.keys(data)
    for (const f of this.entity.fields) {
      if (!f.dbReadOnly && !f.isServerExpression) {
        if (keys.includes(f.key)) {
          newR[f.key] = f.valueConverter.toDb(data[f.key])
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
    return this.find({
      where: Filter.fromEntityFilter(this.entity, resultFilter),
    }).then((y) => y[0])
  }
  async delete(id: any): Promise<void> {
    const { e, collection } = await this.collection()
    let f = new FilterConsumerBridgeToMongo(e)
    Filter.fromEntityFilter(
      this.entity,
      this.entity.idMetadata.getIdFilter(id),
    ).__applyToConsumer(f)
    collection.deleteOne(await f.resolveWhere(), { session: this.session })
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
        let result = []
        for (const element of orElements) {
          let f = new FilterConsumerBridgeToMongo(this.nameProvider)
          f._addWhere = false
          element.__applyToConsumer(f)
          let where = await f.resolveWhere()
          if (where?.$and?.length > 0) {
            result.push(where)
          } else return //since empty or is all rows;
        }
        this.result.push(() => ({
          $or: result,
        }))
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
        $in: val.map((x) => col.valueConverter.toDb(x)),
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
    this.add(col, val, '$regex')
    
    // this.promises.push(col.getDbName().then(colName => {

    //     this.result.push(b => b.whereRaw(
    //         'lower (' + colName + ") like lower ('%" + val.replace(/'/g, '\'\'') + "%')"));
    // }));
  }

  private add(col: FieldMetadata, val: any, operator: string) {
    this.result.push(() => ({
      [this.nameProvider.$dbNameOf(col)]: {
        [operator]: isNull(val) ? val : col.valueConverter.toDb(val),
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
