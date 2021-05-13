import { columnDefs } from "../column-interfaces";


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
    isEqualTo(col: columnDefs, val: any): void;
    isDifferentFrom(col: columnDefs, val: any): void;
    isNull(col: columnDefs): void;
    isNotNull(col: columnDefs): void;
    isGreaterOrEqualTo(col: columnDefs, val: any): void;
    isGreaterThan(col: columnDefs, val: any): void;
    isLessOrEqualTo(col: columnDefs, val: any): void;
    isLessThan(col: columnDefs, val: any): void;
    containsCaseInsensitive(col: columnDefs, val: any): void;
    startsWith(col: columnDefs, val: any): void;
    isIn(col: columnDefs, val: any[]): void;
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