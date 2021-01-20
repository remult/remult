import { EntityDataProvider, EntityDataProviderFindOptions } from '../data-interfaces';
import { Entity } from '../entity';
import { FilterBase, FilterConsumer } from '../filter/filter-interfaces';
import { Column } from '../column';
import { StringColumn } from '../columns/string-column';

export class ArrayEntityDataProvider implements EntityDataProvider {
    constructor(private entity: Entity, private rows?: any[]) {
        if (!rows)
            rows = [];
    }
    async count(where?: FilterBase): Promise<number> {
        let rows = this.rows;
        let j = 0;
        for (let i = 0; i < rows.length; i++) {
            if (!where) {
                j++;
            }
            else {
                let x = new FilterConsumerBridgeToObject(rows[i]);
                where.__applyToConsumer(x);
                if (x.ok)
                    j++;
            }
        }
        return j;
    }
    async find(options?: EntityDataProviderFindOptions): Promise<any[]> {
        let rows = this.rows;
        if (options) {
            if (options.where) {
                rows = rows.filter(i => {
                    let x = new FilterConsumerBridgeToObject(i);
                    options.where.__applyToConsumer(x);
                    return x.ok;
                });
            }
            if (options.orderBy) {
                rows = rows.sort((a: any, b: any) => {
                    let r = 0;
                    for (let i = 0; i < options.orderBy.Segments.length; i++) {
                        let seg = options.orderBy.Segments[i];
                        let left = a[seg.column.defs.key];
                        let right = b[seg.column.defs.key];
                        if (left > right)
                            r = 1;
                        else if (left < right)
                            r = -1;
                        if (r != 0) {
                            if (seg.descending)
                                r *= -1;
                            return r;
                        }
                    }
                    return r;
                });
            }
            rows = pageArray(rows, options);
        }
        if (rows)
            return rows.map(i => {
                return this.map(i);
            });
    }
    map(i: any): any {
        let r = JSON.parse(JSON.stringify(i));
        return r;
    }
    private idMatches(id: any): (item: any) => boolean {
        let f = this.entity.columns.idColumn.isEqualTo(id);
        return item => {
            let x = new FilterConsumerBridgeToObject(item);
            f.__applyToConsumer(x);
            return x.ok;
        };
    }
    public update(id: any, data: any): Promise<any> {
        let idMatches = this.idMatches(id);
        for (let i = 0; i < this.rows.length; i++) {
            if (idMatches(this.rows[i])) {
                this.rows[i] = Object.assign({}, this.rows[i], data);
                return Promise.resolve(this.map(this.rows[i]));
            }
        }
        throw new Error("couldn't find id to update: " + id);
    }
    public delete(id: any): Promise<void> {
        let idMatches = this.idMatches(id);
        for (let i = 0; i < this.rows.length; i++) {
            if (idMatches(this.rows[i])) {
                this.rows.splice(i, 1);
                return Promise.resolve();
            }
        }
        throw new Error("couldn't find id to delete: " + id);
    }
    public insert(data: any): Promise<any> {
        if (data.id)
            this.rows.forEach(i => {
                if (data.id == i.id)
                    throw Error("id already exists");
            });
        this.rows.push(JSON.parse(JSON.stringify(data)));
        return Promise.resolve(JSON.parse(JSON.stringify(data)));
    }
}
function pageArray(rows: any[], options?: EntityDataProviderFindOptions) {
    if (!options)
        return rows;
    if (!options.limit)
        return rows;
    let page = 1;
    if (options.page)
        page = options.page;
    if (page < 1)
        page = 1;
    let x = 0;
    return rows.filter(i => {
        x++;
        let max = page * options.limit;
        let min = max - options.limit;
        return x > min && x <= max;
    });
}
class FilterConsumerBridgeToObject implements FilterConsumer {

    ok = true;
    constructor(private row: any) { }
    or(orElements: FilterBase[]) {
        for (const element of orElements) {
            let filter = new FilterConsumerBridgeToObject(this.row);
            element.__applyToConsumer(filter);
            if (filter.ok) {
                return;
            }
        }
        this.ok = false;
    }
    isNull(col: Column<any>): void {
        if (this.row[col.defs.key] != null)
            this.ok = false;
    }
    isNotNull(col: Column<any>): void {
        if (this.row[col.defs.key] == null)
            this.ok = false;
    }
    isIn(col: Column, val: any[]): void {

        for (const v of val) {
            if (this.row[col.defs.key] == v) {
                return;
            }
        }
        this.ok = false;
    }
    public isEqualTo(col: Column, val: any): void {

        if (this.row[col.defs.key] != val)
            this.ok = false;
    }

    public isDifferentFrom(col: Column, val: any): void {
        if (this.row[col.defs.key] == val)
            this.ok = false;
    }

    public isGreaterOrEqualTo(col: Column, val: any): void {
        if (this.row[col.defs.key] < val)
            this.ok = false;
    }

    public isGreaterThan(col: Column, val: any): void {

        if (this.row[col.defs.key] <= val)
            this.ok = false;
    }

    public isLessOrEqualTo(col: Column, val: any): void {
        if (this.row[col.defs.key] > val)
            this.ok = false;
    }

    public isLessThan(col: Column, val: any): void {
        if (this.row[col.defs.key] >= val)
            this.ok = false;
    }
    public isContainsCaseInsensitive(col: StringColumn, val: any): void {
        let v = this.row[col.defs.key];
        if (!v) {
            this.ok = false;
            return;
        }

        let s = '' + v;
        if (val)
            val = val.toString().toLowerCase();
        if (s.toLowerCase().indexOf(val) < 0)
            this.ok = false;
    }
    public isStartsWith(col: StringColumn, val: any): void {
        let v = this.row[col.defs.key];
        if (!v) {
            this.ok = false;
            return;
        }

        let s = '' + v;
        if (s.indexOf(val) != 0)
            this.ok = false;
    }
}

