
import { EntityDataProvider, EntityDataProviderFindOptions, DataProvider } from "../data-interfaces";
import { SqlCommand, SqlImplementation, SqlResult } from "../sql-command";
import { CompoundIdField } from "../column";

import { CustomSqlFilterBuilderFunction, CustomSqlFilterObject, FilterConsumerBridgeToSqlRequest } from "../filter/filter-consumer-bridge-to-sql-request";
import { customDatabaseFilterToken, Filter } from '../filter/filter-interfaces';
import { Sort, SortSegment } from '../sort';
import { EntityMetadata, FilterRule } from "../remult3";
import { FieldMetadata } from "../column-interfaces";

// @dynamic
export class SqlDatabase implements DataProvider {
  createCommand(): SqlCommand {
    return new LogSQLCommand(this.sql.createCommand(), SqlDatabase.LogToConsole);
  }
  async execute(sql: string) {
    return await this.createCommand().execute(sql);
  }
  getEntityDataProvider(entity: EntityMetadata): EntityDataProvider {

    return new ActualSQLServerDataProvider(entity, this, async () => {

      if (this.createdEntities.indexOf(await entity.getDbName()) < 0) {
        this.createdEntities.push(await entity.getDbName());
        await this.sql.entityIsUsedForTheFirstTime(entity);
      }
    }, this.sql);
  }
  transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void> {
    return this.sql.transaction(async x => {
      let completed = false;
      try {
        await action(new SqlDatabase({
          createCommand: () => {
            let c = x.createCommand();
            return {
              addParameterAndReturnSqlToken: x => c.addParameterAndReturnSqlToken(x),
              execute: async (sql) => {
                if (completed)
                  throw "can't run a command after the transaction was completed";
                return c.execute(sql)
              }
            };
          },
          getLimitSqlSyntax: this.sql.getLimitSqlSyntax,
          entityIsUsedForTheFirstTime: y => x.entityIsUsedForTheFirstTime(y),
          transaction: z => x.transaction(z),
          insertAndReturnAutoIncrementId: x.insertAndReturnAutoIncrementId
        }));
      }
      finally {
        completed = true;
      }
    });
  }
  static customFilter(build: CustomSqlFilterBuilderFunction):FilterRule<any> {
    return {
      [customDatabaseFilterToken]: {
        buildSql: build
      }
    }

  }
  public static LogToConsole = false;
  public static durationThreshold = 0;
  constructor(private sql: SqlImplementation) {

  }
  private createdEntities: string[] = [];
}




class LogSQLCommand implements SqlCommand {
  constructor(private origin: SqlCommand, private allQueries: boolean) {

  }

  args: any = {};
  addParameterAndReturnSqlToken(val: any): string {
    let r = this.origin.addParameterAndReturnSqlToken(val);
    this.args[r] = val;
    return r;
  }
  async execute(sql: string): Promise<SqlResult> {

    try {
      let start = new Date();
      let r = await this.origin.execute(sql);
      if (this.allQueries) {
        var d = new Date().valueOf() - start.valueOf();
        if (d > SqlDatabase.durationThreshold) {
          console.log('Query:', sql);
          console.log("Arguments:", this.args);
          console.log("Duration", d / 1000);
        }
      }
      return r;
    }
    catch (err) {
      console.error('Error:', err);
      console.error('Query:', sql);
      console.error("Arguments", this.args);
      throw err;
    }
  }
}

class ActualSQLServerDataProvider implements EntityDataProvider {
  public static LogToConsole = false;
  constructor(private entity: EntityMetadata, private sql: SqlDatabase, private iAmUsed: () => Promise<void>, private strategy: SqlImplementation) {


  }



  async count(where: Filter): Promise<number> {
    await this.iAmUsed();

    let select = 'select count(*) count from ' + await this.entity.getDbName();
    let r = this.sql.createCommand();
    if (where) {
      let wc = new FilterConsumerBridgeToSqlRequest(r);
      where.__applyToConsumer(wc);
      select += await wc.resolveWhere();
    }

    return r.execute(select).then(r => {
      return +r.rows[0].count;
    });

  }
  async find(options?: EntityDataProviderFindOptions): Promise<any[]> {
    await this.iAmUsed();

    let select = 'select ';
    let colKeys: FieldMetadata[] = [];
    for (const x of this.entity.fields) {
      if (x.isServerExpression) {

      }
      else {
        if (colKeys.length > 0)
          select += ', ';
        select += await x.getDbName();
        colKeys.push(x);
      }
    }

    select += '\n from ' + await this.entity.getDbName();
    let r = this.sql.createCommand();
    if (options) {
      if (options.where) {
        let where = new FilterConsumerBridgeToSqlRequest(r);
        options.where.__applyToConsumer(where);
        select += await where.resolveWhere();
      }
      if (options.limit) {
        options.orderBy = Sort.createUniqueSort(this.entity, x => options.orderBy?.Segments);
      }
      if (options.orderBy) {
        let first = true;
        let segs: SortSegment[] = [];
        for (const s of options.orderBy.Segments) {
          if (s.field instanceof CompoundIdField) {
            segs.push(...s.field.fields.map(c => ({ field: c, isDescending: s.isDescending })))
          }
          else segs.push(s);
        }
        for (const c of segs) {
          if (first) {
            select += ' Order By ';
            first = false;
          }
          else
            select += ', ';

          select += await c.field.getDbName();
          if (c.isDescending)
            select += ' desc';
        }
      }

      if (options.limit) {

        let page = 1;
        if (options.page)
          page = options.page;
        if (page < 1)
          page = 1;
        select += ' ' + this.strategy.getLimitSqlSyntax(options.limit, (page - 1) * options.limit);
      }
    }

    return r.execute(select).then(r => {
      return r.rows.map(y => {
        let result: any = {};
        for (let index = 0; index < colKeys.length; index++) {
          const col = colKeys[index];
          try {
            result[col.key] = col.valueConverter.fromDb(y[r.getColumnKeyInResultForIndexInSelect(index)]);
          }
          catch (err) {
            throw new Error("Failed to load from db:" + col.key + "\r\n" + err);
          }
        }
        return result;
      });
    });
  }

  async update(id: any, data: any): Promise<any> {
    await this.iAmUsed();

    let r = this.sql.createCommand();
    let f = new FilterConsumerBridgeToSqlRequest(r);
    this.entity.idMetadata.getIdFilter(id).__applyToConsumer(f);

    let statement = 'update ' + await this.entity.getDbName() + ' set ';
    let added = false;
    let resultFilter = this.entity.idMetadata.getIdFilter(id);
    if (data.id != undefined)
      resultFilter = this.entity.idMetadata.getIdFilter(data.id);
    for (const x of this.entity.fields) {
      if (x instanceof CompoundIdField) {
        resultFilter = x.resultIdFilter(id, data);
      } if (await isDbReadonly(x)) { }
      else if (data[x.key] !== undefined) {
        let v = x.valueConverter.toDb(data[x.key]);
        if (v !== undefined) {
          if (!added)
            added = true;
          else
            statement += ', ';

          statement += await x.getDbName() + ' = ' + r.addParameterAndReturnSqlToken(v);
        }
      }
    }

    statement += await f.resolveWhere();

    return r.execute(statement).then(() => {
      return this.find({ where: resultFilter }).then(y => y[0]);
    });


  }
  async delete(id: any): Promise<void> {
    await this.iAmUsed();

    let r = this.sql.createCommand();
    let f = new FilterConsumerBridgeToSqlRequest(r);
    this.entity.idMetadata.getIdFilter(id).__applyToConsumer(f);
    let statement = 'delete from ' + await this.entity.getDbName();
    statement += await f.resolveWhere();
    return r.execute(statement).then(() => { });
  }
  async insert(data: any): Promise<any> {
    await this.iAmUsed();

    let r = this.sql.createCommand();
    let f = new FilterConsumerBridgeToSqlRequest(r);
    let cols = '';
    let vals = '';
    let added = false;
    let resultFilter: Filter;
    if (this.entity.idMetadata.field instanceof CompoundIdField)
      resultFilter = this.entity.idMetadata.field.resultIdFilter(undefined, data);
    else
      resultFilter = this.entity.idMetadata.getIdFilter(data[this.entity.idMetadata.field.key]);
    for (const x of this.entity.fields) {

      if (await isDbReadonly(x)) { }

      else {
        let v = x.valueConverter.toDb(data[x.key]);
        if (v != undefined) {
          if (!added)
            added = true;
          else {
            cols += ', ';
            vals += ', ';
          }

          cols += await x.getDbName();
          vals += r.addParameterAndReturnSqlToken(v);
        }
      }
    }


    let statement = `insert into ${await this.entity.getDbName()} (${cols}) values (${vals})`;
    if (this.entity.options.dbAutoIncrementId) {
      let newId = await this.strategy.insertAndReturnAutoIncrementId(r, statement, this.entity);
      resultFilter = new Filter(x => x.isEqualTo(this.entity.idMetadata.field, newId));
    }
    else await r.execute(statement);
    return this.find({ where: resultFilter }).then(y => {
      return y[0];
    });

  }

}

export async function isDbReadonly(x: FieldMetadata) {
  return (x.dbReadOnly || x.isServerExpression || await x.getDbName() != x.options.dbName)
}