import { EntityDataProvider, EntityDataProviderFindOptions } from '../data-interfaces';
import { Filter, FilterConsumer } from '../filter/filter-interfaces';
import { FieldDefinitions } from '../column-interfaces';
import { EntityDefinitions } from '../remult3';


export class ArrayEntityDataProvider implements EntityDataProvider {
    constructor(private entity: EntityDefinitions, private rows?: any[]) {
        if (!rows)
            rows = [];
    }
    async count(where?: Filter): Promise<number> {
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
                        let left = a[seg.field.key];
                        let right = b[seg.field.key];
                        if (left > right)
                            r = 1;
                        else if (left < right)
                            r = -1;
                        if (r != 0) {
                            if (seg.isDescending)
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
                return this.translateFromJson(i);
            });
    }
    translateFromJson(row: any) {
        let result = {};
        for (const col of this.entity.fields) {
            result[col.key] = col.valueConverter.fromJson(row[col.key]);
        }
        return result;
    }
    translateToJson(row: any) {
        let result = {};
        for (const col of this.entity.fields) {
            result[col.key] = col.valueConverter.toJson(row[col.key]);
        }
        return result;
    }

    private idMatches(id: any): (item: any) => boolean {
        return item => {
            let x = new FilterConsumerBridgeToObject(item);
            x.isEqualTo(this.entity.idField, id)
            return x.ok;
        };
    }
    public update(id: any, data: any): Promise<any> {
        let idMatches = this.idMatches(id);
        for (let i = 0; i < this.rows.length; i++) {
            if (idMatches(this.rows[i])) {
                this.rows[i] = Object.assign({}, this.rows[i], this.translateToJson(data));
                return Promise.resolve(this.translateFromJson(this.rows[i]));
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
        let j = this.translateToJson(data);
        this.rows.push(j);
        return Promise.resolve(this.translateFromJson(j));
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
    or(orElements: Filter[]) {
        for (const element of orElements) {
            let filter = new FilterConsumerBridgeToObject(this.row);
            element.__applyToConsumer(filter);
            if (filter.ok) {
                return;
            }
        }
        this.ok = false;
    }
    isNull(col: FieldDefinitions): void {
        if (this.row[col.key] != null)
            this.ok = false;
    }
    isNotNull(col: FieldDefinitions): void {
        if (this.row[col.key] == null)
            this.ok = false;
    }
    isIn(col: FieldDefinitions, val: any[]): void {

        for (const v of val) {
            if (this.row[col.key] == col.valueConverter.toJson(v)) {
                return;
            }
        }
        this.ok = false;
    }
    public isEqualTo(col: FieldDefinitions, val: any): void {

        if (this.row[col.key] != col.valueConverter.toJson(val))
            this.ok = false;
    }

    public isDifferentFrom(col: FieldDefinitions, val: any): void {
        if (this.row[col.key] == col.valueConverter.toJson(val))
            this.ok = false;
    }

    public isGreaterOrEqualTo(col: FieldDefinitions, val: any): void {
        if (this.row[col.key] < col.valueConverter.toJson(val))
            this.ok = false;
    }

    public isGreaterThan(col: FieldDefinitions, val: any): void {

        if (this.row[col.key] <= col.valueConverter.toJson(val))
            this.ok = false;
    }

    public isLessOrEqualTo(col: FieldDefinitions, val: any): void {
        if (this.row[col.key] > col.valueConverter.toJson(val))
            this.ok = false;
    }

    public isLessThan(col: FieldDefinitions, val: any): void {
        if (this.row[col.key] >= col.valueConverter.toJson(val))
            this.ok = false;
    }
    public containsCaseInsensitive(col: FieldDefinitions, val: any): void {
        let v = this.row[col.key];
        if (!v) {
            this.ok = false;
            return;
        }

        let s = '' + v;
        if (val)
            val = col.valueConverter.toJson(val).toString().toLowerCase();
        if (s.toLowerCase().indexOf(val) < 0)
            this.ok = false;
    }
    public startsWith(col: FieldDefinitions, val: any): void {
        let v = this.row[col.key];
        if (!v) {
            this.ok = false;
            return;
        }

        let s = '' + v;
        if (s.indexOf(col.valueConverter.toJson(val)) != 0)
            this.ok = false;
    }
}

