
import { EntityDataProvider, EntityDataProviderFindOptions, DataProvider } from "../data-interfaces";
import { SqlCommand, SqlImplementation, SqlResult } from "../sql-command";
import { CompoundIdField } from "../column";

import { FilterConsumerBridgeToSqlRequest } from "../filter/filter-consumer-bridge-to-sql-request";
import { Filter } from '../filter/filter-interfaces';
import { Sort, SortSegment } from '../sort';
import { EntityDefinitions } from "../remult3";
import { FieldDefinitions } from "../column-interfaces";

// @dynamic
export class SqlDatabase implements DataProvider {
  createCommand(): SqlCommand {
    return new LogSQLCommand(this.sql.createCommand(), SqlDatabase.LogToConsole);
  }
  async execute(sql: string) {
    return await this.createCommand().execute(sql);
  }
  getEntityDataProvider(entity: EntityDefinitions): EntityDataProvider {

    return new ActualSQLServerDataProvider(entity, this, async () => {
      if (this.createdEntities.indexOf(entity.dbName) < 0) {
        this.createdEntities.push(entity.dbName);
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
  constructor(private entity: EntityDefinitions, private sql: SqlDatabase, private iAmUsed: () => Promise<void>, private strategy: SqlImplementation) {


  }



  async count(where: Filter): Promise<number> {
    await this.iAmUsed();
    let select = 'select count(*) count from ' + this.entity.dbName;
    let r = this.sql.createCommand();
    if (where) {
      let wc = new FilterConsumerBridgeToSqlRequest(r);
      where.__applyToConsumer(wc);
      select += wc.where;
    }

    return r.execute(select).then(r => {
      return +r.rows[0].count;
    });

  }
  async find(options?: EntityDataProviderFindOptions): Promise<any[]> {
    await this.iAmUsed();
    let select = 'select ';
    let colKeys: FieldDefinitions[] = [];
    for (const x of this.entity.fields) {
      if (x.isServerExpression) {

      }
      else {
        if (colKeys.length > 0)
          select += ', ';
        select += x.dbName;
        colKeys.push(x);
      }
    }

    select += '\n from ' + this.entity.dbName;
    let r = this.sql.createCommand();
    if (options) {
      if (options.where) {
        let where = new FilterConsumerBridgeToSqlRequest(r);
        options.where.__applyToConsumer(where);
        select += where.where;
      }
      if (options.limit && !options.orderBy) {
        options.orderBy = new Sort({ field: this.entity.idField })
      }
      if (options.orderBy) {
        let first = true;
        let segs: SortSegment[] = [];
        for (const s of options.orderBy.Segments) {
          if (s.field instanceof CompoundIdField) {
            throw new Error("compound column");
            //      segs.push(...s.column.columns.map(c => ({ column: c, descending: s.descending })))
          }
          else segs.push(s);
        }
        segs.forEach(c => {
          if (first) {
            select += ' Order By ';
            first = false;
          }
          else
            select += ', ';

          select += c.field.dbName;
          if (c.isDescending)
            select += ' desc';
        });

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
          result[col.key] = col.valueConverter.fromDb(y[r.getColumnKeyInResultForIndexInSelect(index)]);
        }
        return result;
      });
    });
  }
  async update(id: any, data: any): Promise<any> {
    await this.iAmUsed();

    let r = this.sql.createCommand();
    let f = new FilterConsumerBridgeToSqlRequest(r);
    f.isEqualTo(this.entity.idField, id);

    let statement = 'update ' + this.entity.dbName + ' set ';
    let added = false;
    let resultFilter = new Filter(f => f.isEqualTo(this.entity.idField, id));
    if (data.id != undefined)
      resultFilter = new Filter(f => f.isEqualTo(this.entity.idField, data.id));
    for (const x of this.entity.fields) {
      if (x instanceof CompoundIdField) {
        resultFilter = x.resultIdFilter(id, data);
      } if (x.dbReadOnly||x.isServerExpression) { }
      else {
        let v = x.valueConverter.toDb(data[x.key]);
        if (v != undefined) {
          if (!added)
            added = true;
          else
            statement += ', ';

          statement += x.dbName + ' = ' + r.addParameterAndReturnSqlToken(v);
        }
      }
    }

    statement += f.where;

    return r.execute(statement).then(() => {
      return this.find({ where: resultFilter }).then(y => y[0]);
    });


  }
  async delete(id: any): Promise<void> {
    await this.iAmUsed();
    let r = this.sql.createCommand();
    let f = new FilterConsumerBridgeToSqlRequest(r);
    f.isEqualTo(this.entity.idField, id);
    let statement = 'delete from ' + this.entity.dbName;
    statement += f.where;
    return r.execute(statement).then(()=>{});
  }
  async insert(data: any): Promise<any> {
    await this.iAmUsed();
    let r = this.sql.createCommand();
    let f = new FilterConsumerBridgeToSqlRequest(r);
    let cols = '';
    let vals = '';
    let added = false;
    let resultFilter = new Filter(x => x.isEqualTo(this.entity.idField, data[this.entity.idField.key]));
    for (const x of this.entity.fields) {
      if (x instanceof CompoundIdField) {
        resultFilter = x.resultIdFilter(undefined, data);
      }
      if (x.dbReadOnly||x.isServerExpression) { }

      else {
        let v = x.valueConverter.toDb(data[x.key]);
        if (v != undefined) {
          if (!added)
            added = true;
          else {
            cols += ', ';
            vals += ', ';
          }

          cols += x.dbName;
          vals += r.addParameterAndReturnSqlToken(v);
        }
      }
    }


    let statement = `insert into ${this.entity.dbName} (${cols}) values (${vals})`;
    if (this.entity.dbAutoIncrementId) {
      let newId = await this.strategy.insertAndReturnAutoIncrementId(r, statement, this.entity);
      resultFilter = new Filter(x => x.isEqualTo(this.entity.idField, newId));
    }
    else await r.execute(statement);
    return this.find({ where: resultFilter }).then(y => {
      return y[0];
    });

  }

}