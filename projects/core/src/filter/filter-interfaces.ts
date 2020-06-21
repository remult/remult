import { Column } from '../column';
import { StringColumn } from '../columns/string-column';

export interface FilterBase {
    __applyToConsumer(add: FilterConsumer): void;
}
export interface FilterConsumer {
    isEqualTo(col: Column, val: any): void;
    isDifferentFrom(col: Column, val: any): void;
    isGreaterOrEqualTo(col: Column, val: any): void;
    isGreaterThan(col: Column, val: any): void;
    isLessOrEqualTo(col: Column, val: any): void;
    isLessThan(col: Column, val: any): void;
    isContainsCaseInsensitive(col: StringColumn, val: any): void;
    isStartsWith(col: StringColumn, val: any): void;
    isIn(col: Column, val: any[]): void;
}
