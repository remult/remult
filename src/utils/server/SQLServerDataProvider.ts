
import { pageArray, InMemoryDataProvider } from '../inMemoryDatabase';
import { Entity, Column, CompoundIdColumn, StringColumn, NumberColumn, Sort } from './../utils';
import * as sql from 'mssql';
import { FilterBase, DataProviderFactory, DataProvider, ColumnValueProvider, DataColumnSettings, FindOptions, FilterConsumer, DataApiRequest } from '../dataInterfaces';

import { DataApi, DataApiResponse } from './DataApi';


export class SQLServerDataProvider implements DataProviderFactory {

  pool: sql.ConnectionPool;
  constructor(user: string, password: string, server: string, database: string, instanceName: string) {
    var config: sql.config = {
      user, password, server, database
    };
    if (instanceName)
      config.options = { instanceName };
    this.pool = new sql.ConnectionPool(config);
    this.pool.connect();
  }


  provideFor<T extends Entity<any>>(name: string, factory: () => T): DataProvider {
    return new ActualSQLServerDataProvider(factory, name, this.pool, factory);
  }
  async listOfTables(response: DataApiResponse, request: DataApiRequest<any>) {
    let t = new Tables();
    t.setSource(this);
    let api = new DataApi(t);
    return api.getArray(response, request);

  }
  async getTypeScript(tableName: string) {
    let t = new Tables();
    t.setSource(this);
    let info = await t.source.find({ where: t.Table_Name.isEqualTo(tableName) });
    t = info[0];
    let cols = '';
    let columns = new Columns();
    columns.setSource(this);
    await columns.source.find({
      where: columns.Table_Name.isEqualTo(t.Table_Name).and(
        columns.Table_Schema.isEqualTo(t.Table_Schema).and(
          columns.Table_Catalog.isEqualTo(t.Table_Catalog))),
      orderBy: new Sort({ column: columns.Ordinal_Position })

    }).then(r => {
      r.forEach(c => {

        let t = '';

        switch (c.Data_Type.value) {
          case "decimal":
          case "real":
          case "int":
          case "smallint":
          case "tinyint":
          case "bigint":
          case "float":
          case "numeric":
          case "NUMBER":
          case "money":
            t = 'NumberColumn';
            break;
          case "nchar":
          case "nvarchar":
          case "ntext":
          case "NVARCHAR2":
          case "text":
          case "varchar":
          case "VARCHAR2":
            t = 'StringColumn';
            break;
          case "char":
          case "CHAR":
            if (c.Character_maximum_length.value == 8 && c.Column_Default.value == "('00000000')")
              t = 'DateColumn';
            else
              t = 'StringColumn';
            break;
          case "DATE":
          case "datetime":
            t = 'DateTimeColumn';
            break;
          case "bit":
            t = 'BoolColumn';
            break;

          default:
            t = 'StringColumn';

        }
        let colName = c.Column_Name.value;
        colName = colName[0].toLowerCase() + colName.substring(1);
        cols += `  ${colName} = new radweb.${t}();\n`;
      });
    });
    tableName = t.Table_Name.value[0].toUpperCase() + t.Table_Name.value.substring(1);
    return `export class ${tableName} extends radweb.Entity<number> {
${cols}

  constructor() {
      super(() => new ${tableName}(), environment.dataSource);
      this.initColumns();
  }
}
`;
  }

}

class ActualSQLServerDataProvider<T extends Entity<any>> implements DataProvider {
  constructor(private entityFactory: () => Entity<any>, private name: string, private sql: sql.ConnectionPool, private factory: () => T) {

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
    let r = new sql.Request(this.sql);
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
        if (first){
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

      return pageArray(r.recordset, options).map(y => {
        let result: any = {};
        for (let x in r.recordset.columns) {
          let col = colKeys[r.recordset.columns[x].index];
          result[col.jsonName] = col.__getStorage().fromDb(y[x]);
        }
        return result;
      });
    });
  }
  update(id: any, data: any): Promise<any> {
    if (!this.entity)
      this.entity = this.entityFactory();


    let r = new sql.Request(this.sql);
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

          statement += x.__getDbName() + ' = ' + f.addParameterToCommandAndReturnParameterName(x, v);
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


    let r = new sql.Request(this.sql);
    let f = new FilterConsumerBridgeToSqlRequest(r);
    this.entity.__idColumn.isEqualTo(id).__applyToConsumer(f);
    let statement = 'delete ' + this.entity.__getDbName();
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


    let r = new sql.Request(this.sql);
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
          vals += f.addParameterToCommandAndReturnParameterName(x, v);
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
class FilterConsumerBridgeToSqlRequest implements FilterConsumer {
  where = "";
  constructor(private r: sql.Request) { }
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
    this.where += col.__getDbName() + ' ' + operator + ' ' + this.addParameterToCommandAndReturnParameterName(col, val);

  }

  usedNames: any = {};
  addParameterToCommandAndReturnParameterName(col: Column<any>, val: any) {

    let dbVal = col.__getStorage().toDb(val);

    let orig = col.__getDbName();
    let n = orig;
    let i = 0;

    while (this.usedNames[n])
      n = orig + i++;
    this.usedNames[n] = true;
    this.r.input(n, dbVal);
    return '@' + n;
  }


}

class Tables extends Entity<string> {
  Table_Name = new StringColumn();
  Table_Catalog = new StringColumn();
  Table_Schema = new StringColumn();
  Table_Type = new StringColumn();

  id = new CompoundIdColumn(this, this.Table_Name, this.Table_Schema, this.Table_Catalog);
  constructor() {
    super(() => new Tables(), new InMemoryDataProvider(), { dbName: 'INFORMATION_SCHEMA.TABLES' });
    this.initColumns();
  }
}
class Columns extends Entity<string> {
  Table_Name = new StringColumn();
  Table_Catalog = new StringColumn();
  Table_Schema = new StringColumn();
  Ordinal_Position = new NumberColumn();
  Column_Name = new StringColumn();
  Data_Type = new StringColumn();
  Character_maximum_length = new NumberColumn();
  Column_Default = new StringColumn();


  constructor() {
    super(() => new Columns(), new InMemoryDataProvider(), { dbName: 'INFORMATION_SCHEMA.Columns' });
    this.initColumns(new CompoundIdColumn(this, this.Table_Name, this.Table_Schema, this.Table_Catalog, this.Ordinal_Position));
  }
}
