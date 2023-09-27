import type { EntityDataProvider, EntityDataProviderFindOptions } from '../data-interfaces';
import { type EntityDbNamesBase } from '../filter/filter-consumer-bridge-to-sql-request';
import { Filter } from '../filter/filter-interfaces';
import type { EntityFilter, EntityMetadata } from '../remult3/remult3';
export declare class ArrayEntityDataProvider implements EntityDataProvider {
    private entity;
    private rows?;
    static rawFilter(filter: CustomArrayFilter): EntityFilter<any>;
    constructor(entity: EntityMetadata, rows?: any[]);
    __names: EntityDbNamesBase;
    init(): Promise<EntityDbNamesBase>;
    private verifyThatRowHasAllNotNullColumns;
    count(where?: Filter): Promise<number>;
    find(options?: EntityDataProviderFindOptions): Promise<any[]>;
    translateFromJson(row: any, dbNames: EntityDbNamesBase): {};
    translateToJson(row: any, dbNames: EntityDbNamesBase): {};
    private idMatches;
    update(id: any, data: any): Promise<any>;
    delete(id: any): Promise<void>;
    insert(data: any): Promise<any>;
}
export type CustomArrayFilter = (item: any) => boolean;
export interface CustomArrayFilterObject {
    arrayFilter: CustomArrayFilter;
}
