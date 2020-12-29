
import { SqlCommand } from "../sql-command";
import { Column } from "../column";
import { StringColumn } from "../columns/string-column";
import { FilterConsumer } from './filter-interfaces';

export class FilterConsumerBridgeToSqlRequest implements FilterConsumer {
  where = "";
  constructor(private r: SqlCommand) { }
  isNull(col: Column<any>): void {
    this.addToWhere(col.defs.dbName + ' is null');
  }
  isNotNull(col: Column<any>): void {
    this.addToWhere(col.defs.dbName + ' is not null');
  }
  isIn(col: Column, val: any[]): void {
    if (val && val.length > 0)
      this.addToWhere(col.defs.dbName + " in (" + val.map(x => this.r.addParameterAndReturnSqlToken(x)).join(",") + ")");
    else
      this.addToWhere('1 = 0 /*isIn with no values*/');
  }
  isEqualTo(col: Column, val: any): void {
    this.add(col, val, "=");
  }
  isDifferentFrom(col: Column, val: any): void {
    this.add(col, val, "<>");
  }
  isGreaterOrEqualTo(col: Column, val: any): void {
    this.add(col, val, ">=");
  }
  isGreaterThan(col: Column, val: any): void {
    this.add(col, val, ">");
  }
  isLessOrEqualTo(col: Column, val: any): void {
    this.add(col, val, "<=");
  }
  isLessThan(col: Column, val: any): void {
    this.add(col, val, "<");
  }
  public isContainsCaseInsensitive(col: StringColumn, val: any): void {

    this.addToWhere('lower (' + col.defs.dbName + ") like lower ('%" + val.replace(/'/g, '\'\'') + "%')");
  }
  public isStartsWith(col: StringColumn, val: any): void {
    this.add(col, val + '%', 'like');
  }
  private add(col: Column, val: any, operator: string) {
    let x = col.defs.dbName + ' ' + operator + ' ' + this.r.addParameterAndReturnSqlToken(val);
    this.addToWhere(x);

  }

  private addToWhere(x: string) {
    if (this.where.length == 0) {
      this.where += ' where ';
    }
    else
      this.where += ' and ';
    this.where += x;
  }
}