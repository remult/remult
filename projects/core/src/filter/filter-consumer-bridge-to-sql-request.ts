import { SqlCommand } from "../sql-command";
import { Filter, FilterConsumer } from './filter-interfaces';
import { FieldMetadata } from "../column-interfaces";

export class FilterConsumerBridgeToSqlRequest implements FilterConsumer {
  private where = "";
  _addWhere = true;
  promises: Promise<void>[] = [];
  async resolveWhere() {
    while (this.promises.length > 0) {
      let p = this.promises;
      this.promises = [];
      for (const pr of p) {
        await pr;
      }
    }
    return this.where;
  }

  constructor(private r: SqlCommand) { }

  custom(key:string,customItem: any): void {
    throw new Error("Custom filter should be translated before it gets here");
  }

  or(orElements: Filter[]) {
    let statement = '';
    this.promises.push((async () => {
      for (const element of orElements) {
        let f = new FilterConsumerBridgeToSqlRequest(this.r);
        f._addWhere = false;
        element.__applyToConsumer(f);
        let where = await f.resolveWhere();
        if (where.length > 0) {
          if (statement.length > 0) {
            statement += " or ";
          }
          if (orElements.length > 1) {
            statement += "(" + where + ")";
          }
          else
            statement += where;
        }
      }
      this.addToWhere("(" + statement + ")");
    })());

  }
  isNull(col: FieldMetadata): void {
    this.promises.push((async () => this.addToWhere(await col.getDbName() + ' is null'))());

  }
  isNotNull(col: FieldMetadata): void {
    this.promises.push((async () => this.addToWhere(await col.getDbName() + ' is not null'))());
  }
  isIn(col: FieldMetadata, val: any[]): void {
    this.promises.push((async () => {
      if (val && val.length > 0)
        this.addToWhere(await col.getDbName() + " in (" + val.map(x => this.r.addParameterAndReturnSqlToken(col.valueConverter.toDb(x))).join(",") + ")");
      else
        this.addToWhere('1 = 0 /*isIn with no values*/');
    })());
  }
  isEqualTo(col: FieldMetadata, val: any): void {
    this.add(col, val, "=");
  }
  isDifferentFrom(col: FieldMetadata, val: any): void {
    this.add(col, val, "<>");
  }
  isGreaterOrEqualTo(col: FieldMetadata, val: any): void {
    this.add(col, val, ">=");
  }
  isGreaterThan(col: FieldMetadata, val: any): void {
    this.add(col, val, ">");
  }
  isLessOrEqualTo(col: FieldMetadata, val: any): void {
    this.add(col, val, "<=");
  }
  isLessThan(col: FieldMetadata, val: any): void {
    this.add(col, val, "<");
  }
  public containsCaseInsensitive(col: FieldMetadata, val: any): void {
    this.promises.push((async () => {
      this.addToWhere('lower (' + await col.getDbName() + ") like lower ('%" + val.replace(/'/g, '\'\'') + "%')");
    })());
  }

  private add(col: FieldMetadata, val: any, operator: string) {
    this.promises.push((async () => {
      let x = await col.getDbName() + ' ' + operator + ' ' + this.r.addParameterAndReturnSqlToken(col.valueConverter.toDb(val));
      this.addToWhere(x);
    })());

  }


  private addToWhere(x: string) {
    if (this.where.length == 0) {
      if (this._addWhere)
        this.where += ' where ';
    }
    else
      this.where += ' and ';
    this.where += x;
  }
  databaseCustom(databaseCustom: CustomSqlFilterObject): void {
    this.promises.push((async () => {
      if (databaseCustom?.buildSql) {
        let item = new CustomSqlFilterBuilder(this.r);
        await databaseCustom.buildSql(item);
        if (item.sql) {
          this.addToWhere("(" + item.sql + ")");
        }
      }
    })());
  }
}
export type CustomSqlFilterBuilderFunction = (builder: CustomSqlFilterBuilder) => void | Promise<any>
export interface CustomSqlFilterObject {
  buildSql: CustomSqlFilterBuilderFunction
}
export class CustomSqlFilterBuilder {

  constructor(private r: SqlCommand) {

  }
  sql: string = '';
  addParameterAndReturnSqlToken<valueType>(val: valueType, field?: FieldMetadata<valueType>): string {
    if (field)
      val = field.valueConverter.toDb(val);
    return this.r.addParameterAndReturnSqlToken(val)
  }
}
