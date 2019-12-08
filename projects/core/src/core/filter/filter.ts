import { FilterBase, FilterConsumer } from "../dataInterfaces1";
import { AndFilter } from "./and-filter";

export class Filter implements FilterBase {
    constructor(private apply: (add: FilterConsumer) => void) {
  
    }
    and(filter: FilterBase): AndFilter {
      return new AndFilter(this, filter);
    }
  
    public __applyToConsumer(add: FilterConsumer): void {
      this.apply(add);
    }
  }