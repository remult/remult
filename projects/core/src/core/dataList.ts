import { Entity } from "./entity";
import { EntityProvider,  FindOptionsPerEntity } from "./data-interfaces";
import { FilterBase } from './filter/filter-interfaces';

export class DataList<T extends Entity<any>> implements Iterable<T>{
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
    count(where?: (rowType: T) => FilterBase) {
      return this.entityProvider.count(where);
    }
    get(options?: FindOptionsPerEntity<T>) {
  
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