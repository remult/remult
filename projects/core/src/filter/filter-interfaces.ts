import { FieldDefinitions } from "../column-interfaces";
import { comparableFilterItem, EntityDefinitions, EntityWhere, filterOf, filterOptions, getEntitySettings, sortOf, supportsContains } from "../remult3";


export class Filter {
    constructor(private apply?: (add: FilterConsumer) => void) {
        if (!this.apply) {
            this.apply = () => { };
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
    static createFilterOf<T>(entityDefs: EntityDefinitions<T>): filterOf<T> {
        let r = {};
        for (const c of entityDefs.fields) {
            r[c.key] = new filterHelper(c);
        }
        return r as filterOf<T>;
    }
    static translateWhereToFilter<T>(entity: filterOf<T>, where: EntityWhere<T>): Filter {
        if (Array.isArray(where)) {
            return new AndFilter(...where.map(x =>
                Filter.translateWhereToFilter(entity, x)
            ));
        }
        else if (typeof where === 'function') {
            let r = where(entity);
            if (Array.isArray(r))
                return new AndFilter(...r);
            return r;
        }
    }

}
export class filterHelper implements filterOptions<any>, comparableFilterItem<any>, supportsContains<any>  {
    constructor(private col: FieldDefinitions) {

    }
    processVal(val: any) {
        let ei = getEntitySettings(this.col.dataType, false);
        if (ei) {
            if (!val)
                return null;
            return val.id;
        }
        return val;
    }
    startsWith(val: any): Filter {
        return new Filter(add => add.startsWith(this.col, val));
    }

    contains(val: string): Filter {
        return new Filter(add => add.containsCaseInsensitive(this.col, val));

    }
    isLessThan(val: any): Filter {
        return new Filter(add => add.isLessThan(this.col, val));
    }
    isGreaterOrEqualTo(val: any): Filter {
        return new Filter(add => add.isGreaterOrEqualTo(this.col, val));
    }
    isNotIn(values: any[]): Filter {
        return new Filter(add => {
            for (const v of values) {
                add.isDifferentFrom(this.col, v);
            }
        });
    }
    isDifferentFrom(val: any) {
        val = this.processVal(val);
        if (val === null && this.col.allowNull)
            return new Filter(add => add.isNotNull(this.col));
        return new Filter(add => add.isDifferentFrom(this.col, val));
    }
    isLessOrEqualTo(val: any): Filter {
        return new Filter(add => add.isLessOrEqualTo(this.col, val));
    }
    isGreaterThan(val: any): Filter {
        return new Filter(add => add.isGreaterThan(this.col, val));
    }
    isEqualTo(val: any): Filter {
        val = this.processVal(val);
        if (val === null && this.col.allowNull)
            return new Filter(add => add.isNull(this.col));
        return new Filter(add => add.isEqualTo(this.col, val));
    }
    isIn(val: any[]): Filter {
        val = val.map(x => this.processVal(x));
        return new Filter(add => add.isIn(this.col, val));
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