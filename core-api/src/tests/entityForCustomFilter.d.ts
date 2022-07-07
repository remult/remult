import { EntityBase, EntityFilter } from '../remult3';
export declare class entityForCustomFilter extends EntityBase {
    id: number;
    static filter: ((y: {
        oneAndThree?: boolean;
        dbOneOrThree?: boolean;
        two?: boolean;
    }) => EntityFilter<entityForCustomFilter>) & import("../filter/filter-interfaces").customFilterInfo<entityForCustomFilter>;
    static oneAndThree: (() => EntityFilter<entityForCustomFilter>) & import("../filter/filter-interfaces").customFilterInfo<entityForCustomFilter>;
    static testNumericValue: ((y: number) => EntityFilter<entityForCustomFilter>) & import("../filter/filter-interfaces").customFilterInfo<entityForCustomFilter>;
    static testObjectValue: ((y: {
        val: number;
    }) => EntityFilter<entityForCustomFilter>) & import("../filter/filter-interfaces").customFilterInfo<entityForCustomFilter>;
}
export declare class entityForCustomFilter1 extends entityForCustomFilter {
}
