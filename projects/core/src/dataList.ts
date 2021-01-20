import { Entity } from "./entity";
import { EntityProvider,  FindOptions } from "./data-interfaces";
import { Filter } from './filter/filter-interfaces';

export class DataList<T extends Entity> implements Iterable<T>{
    [Symbol.iterator](): Iterator<T> {
      return this.items[Symbol.iterator]();
    }
  
  
    items: T[] = [];
    constructor(private entityProvider: EntityProvider<T>) {
  
    }
  
    _rowReplacedListeners: ((oldRow: T, newRow: T) => void)[] = [];
  
    private map(item: T): T {
  
      item.__entityData.register({
        rowReset: (newRow) => {
          if (newRow)
            this.items.splice(this.items.indexOf(item), 1);
  
        },
        rowDeleted: () => { this.items.splice(this.items.indexOf(item), 1) }
      });
      return item;
    }
    lastGetId = 0;
    count(where?: (rowType: T) => Filter) {
      return this.entityProvider.count(where);
    }
    get(options?: FindOptions<T>) {
  
      let getId = ++this.lastGetId;
  
      return this.entityProvider.find(options).then(r => {
        let x: T[] = r;
        let result = r.map((x: any) => this.map(x));
        if (getId == this.lastGetId)
          this.items = result;
        return result;
      });
    }
    add(): T {
      let x = this.map(this.entityProvider.create());
      this.items.push(x);
      return x;
    }
  
  }