import { FieldMetadata } from "./column-interfaces";
import { EntityMetadata, EntityOrderBy } from "./remult3";
export declare class Sort {
    toEntityOrderBy(): EntityOrderBy<any>;
    constructor(...segments: SortSegment[]);
    Segments: SortSegment[];
    reverse(): Sort;
    static translateOrderByToSort<T>(entityDefs: EntityMetadata<T>, orderBy: EntityOrderBy<T>): Sort;
    static createUniqueSort<T>(entityMetadata: EntityMetadata<T>, orderBy: Sort): Sort;
    static createUniqueEntityOrderBy<T>(entityMetadata: EntityMetadata<T>, orderBy: EntityOrderBy<T>): EntityOrderBy<T>;
}
export interface SortSegment {
    field: FieldMetadata;
    isDescending?: boolean;
}
