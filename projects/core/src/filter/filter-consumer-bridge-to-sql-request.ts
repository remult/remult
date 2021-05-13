
import { SqlCommand } from "../sql-command";
import { Column } from "../column";
import { StringColumn } from "../columns/string-column";
import { Filter, FilterConsumer } from './filter-interfaces';
import { columnDefs } from "../column-interfaces";


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
  isNull(col: columnDefs): void {
    this.addToWhere(col.dbName + ' is null');
  }
  isNotNull(col: columnDefs): void {
    this.addToWhere(col.dbName + ' is not null');
  }
  isIn(col: columnDefs, val: any[]): void {
    if (val && val.length > 0)
      this.addToWhere(col.dbName + " in (" + val.map(x => this.r.addParameterAndReturnSqlToken(x)).join(",") + ")");
    else
      this.addToWhere('1 = 0 /*isIn with no values*/');
  }
  isEqualTo(col: columnDefs, val: any): void {
    this.add(col, val, "=");
  }
  isDifferentFrom(col: columnDefs, val: any): void {
    this.add(col, val, "<>");
  }
  isGreaterOrEqualTo(col: columnDefs, val: any): void {
    this.add(col, val, ">=");
  }
  isGreaterThan(col: columnDefs, val: any): void {
    this.add(col, val, ">");
  }
  isLessOrEqualTo(col: columnDefs, val: any): void {
    this.add(col, val, "<=");
  }
  isLessThan(col: columnDefs, val: any): void {
    this.add(col, val, "<");
  }
  public containsCaseInsensitive(col: columnDefs, val: any): void {

    this.addToWhere('lower (' + col.dbName + ") like lower ('%" + val.replace(/'/g, '\'\'') + "%')");
  }
  public startsWith(col: columnDefs, val: any): void {
    this.add(col, val + '%', 'like');
  }
  private add(col: columnDefs, val: any, operator: string) {
    let x = col.dbName + ' ' + operator + ' ' + this.r.addParameterAndReturnSqlToken(col.dbLoader.toDb(val));
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