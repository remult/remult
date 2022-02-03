import { EntityFilter, FindOptions,  Repository } from "remult/src/remult3";

export class DataList<T> implements Iterable<T>{
  [Symbol.iterator](): Iterator<T> {
    return this.items[Symbol.iterator]();
  }


  items: T[] = [];
  constructor(private repository: Repository<T>) {
    repository.addEventListener({
      deleted: entity => {
        this.removeItem(entity)
      }
    });
  }
  removeItem(item: T) {
    let i = this.items.indexOf(item);
    if (i >= 0)
      this.items.splice(i, 1);
  }



  private map(item: T): T {
    return item;
  }
  lastGetId = 0;
  count(where?: EntityFilter<T>) {
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