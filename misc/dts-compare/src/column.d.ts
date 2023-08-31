import type { FindOptions, idType, Repository } from './remult3/remult3';
import type { RepositoryImplementation } from './remult3/RepositoryImplementation';
export declare function makeTitle(name: string): string;
export declare class LookupColumn<T> {
    private repository;
    id: idType<T>;
    toJson(): any;
    setId(val: any): void;
    waitLoadOf(id: any): Promise<T>;
    get(id: any): any;
    storedItem: {
        item: T;
    };
    set(item: T): void;
    constructor(repository: RepositoryImplementation<T>, id: idType<T>);
    get item(): T;
    waitLoad(): Promise<T>;
}
export declare class OneToMany<T> {
    private provider;
    private settings?;
    constructor(provider: Repository<T>, settings?: {
        create?: (newItem: T) => void;
    } & FindOptions<T>);
    private _items;
    private _currentPromise;
    get lazyItems(): T[];
    load(): Promise<T[]>;
    private find;
    create(item?: Partial<T>): T;
}
