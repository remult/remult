import type { idType, Repository } from './remult3/remult3';
export declare function makeTitle(name: string): string;
export declare class LookupColumn<T> {
    private repository;
    private isReferenceRelation;
    toJson(): any;
    setId(val: any): void;
    waitLoadOf(id: any): Promise<T>;
    get(id: any): any;
    storedItem?: {
        item: T;
    };
    set(item: T): void;
    id: idType<T>;
    constructor(repository: Repository<T>, isReferenceRelation: any);
    get item(): T;
    waitLoad(): Promise<T>;
}
