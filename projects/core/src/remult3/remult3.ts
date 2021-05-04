import { ColumnSettings } from "../column-interfaces";
import { Context, UserInfo } from "../context";
import { EntityOptions } from "../entity";
import { Filter } from "../filter/filter-interfaces";


export class IdEntity {
    id: string;
}
/*
[] think of id entity.
[] rename `name` to `key` in Entity Settings
*/


interface rowHelper<T> {
    save();
    delete();
    isNew();
    wasChanged();
}
export type entityOf<Type> = {
    [Properties in keyof Type]: column<Type[Properties]>
} & rowHelper<Type>


export type sortOf<Type> = {
    [Properties in keyof Type]: TheSort
}
export interface TheSort {
    descending: TheSort,
}
export type idOf<Type> = {
    [Properties in keyof Type]: IdDefs
}
export interface IdDefs {

}

export interface column<T> {
    caption: string;
    inputType: string;
    error: string;
    displayValue: string;
    inputValue: string;
    value: T;
    originalValue: T;
    wasChanged(): boolean;
}

export interface Repository<T> {
    find(options?: FindOptions<T>): Promise<T[]>,
    count(where?: EntityWhere<T>): Promise<number>,
    findFirst(where: EntityWhere<T>): Promise<T>,
    create(): T,
    findId(id: any): Promise<T>,
    save(entity: T): Promise<T>,
    delete(entity:T):Promise<T>
}
export interface FindOptions<T> {


}
export declare type EntityWhereItem<entityType> = ((entityType: filterOf<entityType>, context: Context) => (Filter | Filter[]));

export declare type EntityWhere<entityType> = EntityWhereItem<entityType> | EntityWhereItem<entityType>[];

export class OneToMany<T> {
    constructor(rep: Repository<T>, options: FindOptions<T>) {

    }
    create(): T {
        return undefined;
    }
    items: T[];


}
export class ManyToOne<T> {
    constructor(rep: Repository<T>, where: EntityWhere<T>) {

    }
    async waitLoad() {

    }
    exists() {
        return false;
    }
    item: T;
}
export class BaseEntity {
    _: entityOf<this>;
}

interface filterOptions<x> {
    isEqualTo(val: x): Filter;
    isIn(val: x[]): Filter;
}

interface comparableFilterItem<x> extends filterOptions<x> {
    isGreaterThan(val: x): Filter;
}
interface supportsContains<x> extends filterOptions<x> {
    contains(val: string): Filter;
}

export type filterOf<Type> = {
    [Properties in keyof Type]: Type[Properties] extends number | Date ? comparableFilterItem<Type[Properties]> :
    Type[Properties] extends string ? supportsContains<Type[Properties]> & comparableFilterItem<Type[Properties]> :
    supportsContains<Type[Properties]>
}

export type NewEntity<T> = { new(...args: any[]): T };