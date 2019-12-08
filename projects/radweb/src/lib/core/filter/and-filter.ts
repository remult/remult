import { FilterBase, FilterConsumer } from "../dataInterfaces1";

export class AndFilter implements FilterBase {
    constructor(private a: FilterBase, private b: FilterBase) {
  
    }
    and(filter: FilterBase): AndFilter {
      return new AndFilter(this, filter);
    }
  
    public __applyToConsumer(add: FilterConsumer): void {
      if (this.a)
        this.a.__applyToConsumer(add);
      if (this.b)
        this.b.__applyToConsumer(add);
    }
  }