import { EntityDataProvider, EntityDataProviderFindOptions } from '../data-interfaces';
import { Filter } from '../filter/filter-interfaces';
import { EntityMetadata, EntityFilter } from '../remult3';
export declare class ArrayEntityDataProvider implements EntityDataProvider {
    private entity;
    private rows?;
    static rawFilter(filter: CustomArrayFilter): EntityFilter<any>;
    constructor(entity: EntityMetadata, rows?: any[]);
    private verifyThatRowHasAllNotNullColumns;
    count(where?: Filter): Promise<number>;
    find(options?: EntityDataProviderFindOptions): Promise<any[]>;
    translateFromJson(row: any): {};
    translateToJson(row: any): {};
    private idMatches;
    update(id: any, data: any): Promise<any>;
    delete(id: any): Promise<void>;
    insert(data: any): Promise<any>;
}
export declare type CustomArrayFilter = (item: any) => boolean;
export interface CustomArrayFilterObject {
    arrayFilter: CustomArrayFilter;
}
