import { ColumnDefinitions } from "../column-interfaces";


export class Filter {
    constructor(private apply?: (add: FilterConsumer) => void) {
        if (!this.apply){
            this.apply=()=>{};
        }
    }
    __applyToConsumer(add: FilterConsumer) {
        this.apply(add);
    }
    and(filter: Filter): Filter {
        return new AndFilter(this, filter);
    }
    or(filter: Filter): Filter {
        return new OrFilter(this, filter);
    }
}
export interface FilterConsumer {
    or(orElements: Filter[]);
    isEqualTo(col: ColumnDefinitions, val: any): void;
    isDifferentFrom(col: ColumnDefinitions, val: any): void;
    isNull(col: ColumnDefinitions): void;
    isNotNull(col: ColumnDefinitions): void;
    isGreaterOrEqualTo(col: ColumnDefinitions, val: any): void;
    isGreaterThan(col: ColumnDefinitions, val: any): void;
    isLessOrEqualTo(col: ColumnDefinitions, val: any): void;
    isLessThan(col: ColumnDefinitions, val: any): void;
    containsCaseInsensitive(col: ColumnDefinitions, val: any): void;
    startsWith(col: ColumnDefinitions, val: any): void;
    isIn(col: ColumnDefinitions, val: any[]): void;
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
            if (f.length > 1) {
                add.or(f);
            }
            else if (f.length == 1)
                f[0].__applyToConsumer(add);
        });
    }
}