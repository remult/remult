
import { SqlCommand } from "../sql-command";
import { Column } from "../column";
import { StringColumn } from "../columns/string-column";
import { Filter, FilterConsumer } from './filter-interfaces';

export class FilterConsumerBridgeToSqlRequest implements FilterConsumer {
  where = "";
  private _addWhere = true;
  constructor(private r: SqlCommand) { }
  or(orElements: Filter[]) {
    let statement = '';
    for (const element of orElements) {
      let f = new FilterConsumerBridgeToSqlRequest(this.r);
      f._addWhere = false;
      element.__applyToConsumer(f);
      if (f.where.length > 0) {
        if (statement.length > 0) {
          statement += " or ";
        }
        if (orElements.length > 1) {
          statement += "(" + f.where + ")";
        }
        else
          statement += f.where;
      }
    }
    this.addToWhere("(" + statement + ")");
  }
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
    if (this.where.length == 0 ) {
      if (this._addWhere)
        this.where += ' where ';
    }
    else
      this.where += ' and ';
    this.where += x;
  }
}