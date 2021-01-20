import { Column } from '../column';
import { StringColumn } from '../columns/string-column';


export class Filter {
    constructor(private apply: (add: FilterConsumer) => void) {

    }
    __applyToConsumer(add: FilterConsumer) {
        this.apply(add);
    }
    and(filter: Filter): Filter {
        return new AndFilter(this, filter);
    }
    or(filter: Filter): Filter {
        return new OrFilter(filter);
    }
}
export interface FilterConsumer {
    or(orElements: Filter[]);
    isEqualTo(col: Column, val: any): void;
    isDifferentFrom(col: Column, val: any): void;
    isNull(col: Column): void;
    isNotNull(col: Column): void;
    isGreaterOrEqualTo(col: Column, val: any): void;
    isGreaterThan(col: Column, val: any): void;
    isLessOrEqualTo(col: Column, val: any): void;
    isLessThan(col: Column, val: any): void;
    isContainsCaseInsensitive(col: StringColumn, val: any): void;
    isStartsWith(col: StringColumn, val: any): void;
    isIn(col: Column, val: any[]): void;
}


export class AndFilter extends Filter {

    constructor(...filters: Filter[]) {
        super(add => {
            for (const iterator of filters) {
                if (iterator)
                    iterator.__applyToConsumer(add);
            }
        });
    }
}
export class OrFilter extends Filter {
    
    constructor(...filters: Filter[]) {
        super(add => {
            let f = filters.filter(x => x !== undefined);
            if (f.length > 0) {
                add.or(f);
            }
        });
    }
}