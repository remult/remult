
import { AndFilter } from "./and-filter";
import { FilterBase, FilterConsumer } from './filter-interfaces';

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