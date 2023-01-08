import { EntityBase, EntityFilter } from '../remult3';
export declare class entityForrawFilter extends EntityBase {
    id: number;
    static filter: ((y: {
        oneAndThree?: boolean;
        dbOneOrThree?: boolean;
        two?: boolean;
    }) => EntityFilter<entityForrawFilter>) & import("../filter/filter-interfaces").rawFilterInfo<entityForrawFilter>;
    static oneAndThree: (() => EntityFilter<entityForrawFilter>) & import("../filter/filter-interfaces").rawFilterInfo<entityForrawFilter>;
    static testNumericValue: ((y: number) => EntityFilter<entityForrawFilter>) & import("../filter/filter-interfaces").rawFilterInfo<entityForrawFilter>;
    static testObjectValue: ((y: {
        val: number;
    }) => EntityFilter<entityForrawFilter>) & import("../filter/filter-interfaces").rawFilterInfo<entityForrawFilter>;
}
export declare class entityForrawFilter1 extends entityForrawFilter {
}
