import { Column } from '../column';
import { StringColumn } from '../columns/string-column';

export interface FilterBase {
    __applyToConsumer(add: FilterConsumer): void;
}
export interface FilterConsumer {
    isEqualTo(col: Column<any>, val: any): void;
    isDifferentFrom(col: Column<any>, val: any): void;
    isGreaterOrEqualTo(col: Column<any>, val: any): void;
    isGreaterThan(col: Column<any>, val: any): void;
    isLessOrEqualTo(col: Column<any>, val: any): void;
    isLessThan(col: Column<any>, val: any): void;
    isContains(col: StringColumn, val: any): void;
    isStartsWith(col: StringColumn, val: any): void;
    isIn(col: Column<any>, val: any[]): void;
}
