import { FieldDefinitions } from "../column-interfaces";


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
    isEqualTo(col: FieldDefinitions, val: any): void;
    isDifferentFrom(col: FieldDefinitions, val: any): void;
    isNull(col: FieldDefinitions): void;
    isNotNull(col: FieldDefinitions): void;
    isGreaterOrEqualTo(col: FieldDefinitions, val: any): void;
    isGreaterThan(col: FieldDefinitions, val: any): void;
    isLessOrEqualTo(col: FieldDefinitions, val: any): void;
    isLessThan(col: FieldDefinitions, val: any): void;
    containsCaseInsensitive(col: FieldDefinitions, val: any): void;
    startsWith(col: FieldDefinitions, val: any): void;
    isIn(col: FieldDefinitions, val: any[]): void;
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