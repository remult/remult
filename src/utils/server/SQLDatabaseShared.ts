import { Column, CompoundIdColumn, Entity } from "../..";
import { FilterConsumer, DataProvider, FindOptions } from "../DataInterfaces";
import { pageArray } from "../inMemoryDatabase";



export interface SQLCommand {
    addParameterToCommandAndReturnParameterName(col: Column<any>, val: any): string;
    query(sql: string): Promise<SQLQueryResult>;
}
export interface SQLQueryResult  {
    rows:any[];
    getColumnIndex(name:string):number;
}



export interface SQLConnectionProvider {
    createCommand(): SQLCommand;
}

export class FilterConsumerBridgeToSqlRequest implements FilterConsumer {
    where = "";
    constructor(private r: SQLCommand) { }
    IsEqualTo(col: Column<any>, val: any): void {
        this.add(col, val, "=");
    }
    IsDifferentFrom(col: Column<any>, val: any): void {
        this.add(col, val, "<>");
    }
    IsGreaterOrEqualTo(col: Column<any>, val: any): void {
        this.add(col, val, ">=");
    }
    IsGreaterThan(col: Column<any>, val: any): void {
        this.add(col, val, ">");
    }
    IsLessOrEqualTo(col: Column<any>, val: any): void {
        this.add(col, val, "<=");
    }
    IsLessThan(col: Column<any>, val: any): void {
        this.add(col, val, "<");
    }
    private add(col: Column<any>, val: any, operator: string) {
        if (this.where.length == 0) {

            this.where += ' where ';
        } else this.where += ' and ';
        this.where += col.__getDbName() + ' ' + operator + ' ' + this.r.addParameterToCommandAndReturnParameterName(col, val);

    }





}
export class ActualSQLServerDataProvider<T extends Entity<any>> implements DataProvider {
    constructor(private entityFactory: () => Entity<any>, private name: string, private sql: SQLConnectionProvider, private factory: () => T) {
  
    }
    private entity: Entity<any>;
    find(options?: FindOptions): Promise<any[]> {
      if (!this.entity)
        this.entity = this.entityFactory();
      let select = 'select ';
      let colKeys: Column<any>[] = [];
      this.entity.__iterateColumns().forEach(x => {
        if (x.__isVirtual()) {
  
        }
        else {
          if (colKeys.length > 0)
            select += ', ';
          select += x.__getDbName();
          colKeys.push(x);
        }
      });
      select += ' from ' + this.entity.__getDbName();
      let r = this.sql.createCommand();
      if (options) {
        if (options.where) {
          let where = new FilterConsumerBridgeToSqlRequest(r);
          options.where.__applyToConsumer(where);
          select += where.where;
        }
      }
      if (options.orderBy) {
        let first = true;
        options.orderBy.Segments.forEach(c => {
          if (first) {
            select += ' Order By ';
            first = false;
          }
          else
            select += ', ';
          select += c.column.__getDbName();
          if (c.descending)
            select += ' desc';
        });
  
      }
      console.log(select);
      return r.query(select).then(r => {
  
        return pageArray(r.rows, options).map(y => {
          let result: any = {};
          for (let x in y) {
            let col = colKeys[r.getColumnIndex(x)];
            result[col.jsonName] = col.__getStorage().fromDb(y[x]);
          }
          return result;
        });
      });
    }
    update(id: any, data: any): Promise<any> {
      if (!this.entity)
        this.entity = this.entityFactory();
  
  
      let r = this.sql.createCommand();
      let f = new FilterConsumerBridgeToSqlRequest(r);
      this.entity.__idColumn.isEqualTo(id).__applyToConsumer(f);
      let statement = 'update ' + this.entity.__getDbName() + ' set ';
      let added = false;
      let resultFilter = this.entity.__idColumn.isEqualTo(id);
      if (data.id != undefined)
        resultFilter = this.entity.__idColumn.isEqualTo(data.id);
  
      this.entity.__iterateColumns().forEach(x => {
        if (x instanceof CompoundIdColumn) {
          resultFilter = x.resultIdFilter(id, data);
        } if (x.__isVirtual()) { }
        else {
          let v = data[x.jsonName];
          if (v != undefined) {
            if (!added)
              added = true;
            else
              statement += ', ';
  
            statement += x.__getDbName() + ' = ' + r.addParameterToCommandAndReturnParameterName(x, v);
          }
        }
      });
      statement += f.where;
      console.log(statement);
      return r.query(statement).then(() => {
        return this.find({ where: resultFilter }).then(y => y[0]);
      });
  
  
    }
    delete(id: any): Promise<void> {
      if (!this.entity)
        this.entity = this.entityFactory();
  
  
      let r = this.sql.createCommand();
      let f = new FilterConsumerBridgeToSqlRequest(r);
      this.entity.__idColumn.isEqualTo(id).__applyToConsumer(f);
      let statement = 'delete from ' + this.entity.__getDbName();
      let added = false;
  
      statement += f.where;
      console.log(statement);
      return r.query(statement).then(() => {
        return this.find({ where: this.entity.__idColumn.isEqualTo(id) }).then(y => y[0]);
      });
  
    }
    insert(data: any): Promise<any> {
      if (!this.entity)
        this.entity = this.entityFactory();
  
  
      let r = this.sql.createCommand();
      let f = new FilterConsumerBridgeToSqlRequest(r);
  
  
      let cols = '';
      let vals = '';
      let added = false;
      let resultFilter = this.entity.__idColumn.isEqualTo(data[this.entity.__idColumn.jsonName]);
  
      this.entity.__iterateColumns().forEach(x => {
        if (x instanceof CompoundIdColumn) {
          resultFilter = x.resultIdFilter(undefined, data);
        }
        if (x.__isVirtual()) { }
  
        else {
          let v = data[x.jsonName];
          if (v != undefined) {
            if (!added)
              added = true;
            else {
              cols += ', ';
              vals += ', ';
            }
  
            cols += x.__getDbName();
            vals += r.addParameterToCommandAndReturnParameterName(x, v);
          }
        }
      });
  
      let statement = `insert into ${this.entity.__getDbName()} (${cols}) values (${vals})`;
      console.log(statement);
      return r.query(statement).then(() => {
        return this.find({ where: resultFilter }).then(y => {
  
          return y[0];
        });
      });
    }
  
  }