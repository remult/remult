
import { SqlCommand } from "../sql-command";
import { Column } from "../column";
import { StringColumn } from "../columns/string-column";
import { FilterConsumer } from './filter-interfaces';

export class FilterConsumerBridgeToSqlRequest implements FilterConsumer {
    where = "";
    constructor(private r: SqlCommand) { }
    isEqualTo(col: Column<any>, val: any): void {
      this.add(col, val, "=");
    }
    isDifferentFrom(col: Column<any>, val: any): void {
      this.add(col, val, "<>");
    }
    isGreaterOrEqualTo(col: Column<any>, val: any): void {
      this.add(col, val, ">=");
    }
    isGreaterThan(col: Column<any>, val: any): void {
      this.add(col, val, ">");
    }
    isLessOrEqualTo(col: Column<any>, val: any): void {
      this.add(col, val, "<=");
    }
    isLessThan(col: Column<any>, val: any): void {
      this.add(col, val, "<");
    }
    public isContains(col: StringColumn, val: any): void {
      this.add(col, '%' + val + '%', 'like');
    }
    public isStartsWith(col: StringColumn, val: any): void {
      this.add(col, val + '%', 'like');
    }
    private add(col: Column<any>, val: any, operator: string) {
      if (this.where.length == 0) {
  
        this.where += ' where ';
      } else this.where += ' and ';
      this.where += col.__getDbName() + ' ' + operator + ' ' + this.r.addParameterAndReturnSqlToken( val);
  
    }
  
  
  
  
  
  }