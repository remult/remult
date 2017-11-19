import { Entity, EntitySource } from './Entity';
import { FindOptions } from './dataInterfaces';
export class RestList<T extends Entity> implements Iterable<T>{
  [Symbol.iterator](): Iterator<T> {
    return this.items[Symbol.iterator]();
  }


  items: T[] = [];
  constructor(private source: EntitySource<T>) {

  }
  _rowReplacedListeners: ((oldRow: T, newRow: T) => void)[] = [];

  private map(item: T): T {

    item.__entityData.register({
      rowReset: (newRow) => {
        if (newRow)
          this.items.splice(this.items.indexOf(item), 1);

      },
      rowDeleted: () => { this.items.splice(this.items.indexOf(item)) }
    });
    return item;
  }
  lastGetId = 0;
  get(options?: FindOptions) {

    let getId = ++this.lastGetId;

    return this.source.find(options).then(r => {
      let x: T[] = r;
      let result = r.map((x: any) => this.map(x));
      if (getId == this.lastGetId)
        this.items = result;
      return result;
    });
  }
  add(): T {
    let x = this.map(this.source.createNewItem());
    this.items.push(x);
    return x;
  }
  replaceRow(originalRow: any, newRow: any) {
    newRow = this.map(newRow);
    this.items[this.items.indexOf(originalRow)] = newRow;
    this._rowReplacedListeners.forEach(x => x(originalRow, newRow));
  }


}
