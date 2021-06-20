import { SqlCommand } from "../sql-command";
import { Filter, FilterConsumer } from './filter-interfaces';
import { FieldDefinitions } from "../column-interfaces";
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
  isNull(col: FieldDefinitions): void {
    this.addToWhere(col.dbName + ' is null');
  }
  isNotNull(col: FieldDefinitions): void {
    this.addToWhere(col.dbName + ' is not null');
  }
  isIn(col: FieldDefinitions, val: any[]): void {
    if (val && val.length > 0)
      this.addToWhere(col.dbName + " in (" + val.map(x => this.r.addParameterAndReturnSqlToken(col.valueConverter.toDb( x))).join(",") + ")");
    else
      this.addToWhere('1 = 0 /*isIn with no values*/');
  }
  isEqualTo(col: FieldDefinitions, val: any): void {
    this.add(col, val, "=");
  }
  isDifferentFrom(col: FieldDefinitions, val: any): void {
    this.add(col, val, "<>");
  }
  isGreaterOrEqualTo(col: FieldDefinitions, val: any): void {
    this.add(col, val, ">=");
  }
  isGreaterThan(col: FieldDefinitions, val: any): void {
    this.add(col, val, ">");
  }
  isLessOrEqualTo(col: FieldDefinitions, val: any): void {
    this.add(col, val, "<=");
  }
  isLessThan(col: FieldDefinitions, val: any): void {
    this.add(col, val, "<");
  }
  public containsCaseInsensitive(col: FieldDefinitions, val: any): void {
    this.addToWhere('lower (' + col.dbName + ") like lower ('%" + val.replace(/'/g, '\'\'') + "%')");
  }
  public startsWith(col: FieldDefinitions, val: any): void {
    this.add(col, val + '%', 'like');
  }
  private add(col: FieldDefinitions, val: any, operator: string) {
    let x = col.dbName + ' ' + operator + ' ' + this.r.addParameterAndReturnSqlToken(col.valueConverter.toDb(val));
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