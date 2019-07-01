
import {  DataProviderFactory, DataProvider,  DataApiRequest,DataApi, DataApiResponse, InMemoryDataProvider ,Entity, Column, CompoundIdColumn, StringColumn, NumberColumn, Sort, SQLConnectionProvider, SQLCommand, SQLQueryResult} from 'radweb';
import * as sql from 'mssql';
import { ActualSQLServerDataProvider } from 'radweb-server';

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
    return new ActualSQLServerDataProvider(factory, name, new SQLServerBridgeToSQLConnectionProvider(this.pool), factory);
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

class SQLServerBridgeToSQLConnectionProvider implements SQLConnectionProvider {
  constructor(private sql: sql.ConnectionPool) { }
  createCommand(): SQLCommand {
    return new SQLServerBridgeToSQLCommand(new sql.Request(this.sql));
  }
}
class SQLServerBridgeToSQLCommand implements SQLCommand {
  query(sql: string): Promise<SQLQueryResult> {
    return this.r.query(sql).then(x => new SQLRecordSetBridgeToSQlQueryResult(x));
  }
  constructor(private r: sql.Request) {

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
class SQLRecordSetBridgeToSQlQueryResult implements SQLQueryResult {
  getColumnIndex(name: string): number {
    return this.r.recordset.columns[name].index;
  }
  rows: any[];
  
  constructor(private r: sql.IResult<any>) {
    if (r.recordset) {
      this.rows = r.recordset;
      
    }
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
