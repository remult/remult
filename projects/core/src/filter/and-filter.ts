import { FilterBase, FilterConsumer } from "./filter-interfaces";

export class AndFilter implements FilterBase {
  private filters: FilterBase[] = [];
  constructor(...filters: FilterBase[]) {
    this.filters = filters;
  }
  and(filter: FilterBase): AndFilter {
    return new AndFilter(this, filter);
  }

  public __applyToConsumer(add: FilterConsumer): void {
    for (const iterator of this.filters) {
      if (iterator)
        iterator.__applyToConsumer(add);
    }
  }
}
export class OrFilter implements FilterBase {
  private filters: FilterBase[] = [];
  constructor(...filters: FilterBase[]) {
    this.filters = filters;
  }
  and(filter: FilterBase): FilterBase {
    return new AndFilter(this, filter);
  }
  public __applyToConsumer(add: FilterConsumer): void {
    let f = this.filters.filter(x=>x!==undefined);
    if (f.length>0){
      add.or(f);
    }
    
  }
}