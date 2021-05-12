import { EntityWhere, FindOptions, getEntityOf, Repository } from "./remult3";

export class DataList<T> implements Iterable<T>{
    [Symbol.iterator](): Iterator<T> {
      return this.items[Symbol.iterator]();
    }
  
  
    items: T[] = [];
    constructor(private repository: Repository<T>) {
  
    }
  
    _rowReplacedListeners: ((oldRow: T, newRow: T) => void)[] = [];
  
    private map(item: T): T {
      getEntityOf(item).register({
        rowReset: (newRow) => {
          if (newRow)
            this.items.splice(this.items.indexOf(item), 1);
  
        },
        rowDeleted: () => { this.items.splice(this.items.indexOf(item), 1) }
      });
      return item;
    }
    lastGetId = 0;
    count(where?: EntityWhere<T>) {
      return this.repository.count(where);
    }
    get(options?: FindOptions<T>) {
  
      let getId = ++this.lastGetId;
  
      return this.repository.find(options).then(r => {
        let x: T[] = r;
        let result = r.map((x: any) => this.map(x));
        if (getId == this.lastGetId)
          this.items = result;
        return result;
      });
    }
    add(): T {
      let x = this.map(this.repository.create());
      this.items.push(x);
      return x;
    }
  
  }