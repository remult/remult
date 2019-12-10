
import {
    FindOptionsPerEntity
} from './data-interfaces';

import { Column } from './column';
import { Entity } from './entity';
import { Sort } from './sort';








export function extractSortFromSettings<T extends Entity<any>>(entity: T, opt: FindOptionsPerEntity<T>): Sort {
  if (!opt)
    return undefined;
  if (!opt.orderBy)
    return undefined;
  let x = opt.orderBy(entity);
  return translateSort(x);

}
export function translateSort(sort: any): Sort {
  if (sort instanceof Sort)
    return sort;
  if (sort instanceof Column)
    return new Sort({ column: sort });
  if (sort instanceof Array) {
    let r = new Sort();
    sort.forEach(i => {
      if (i instanceof Column)
        r.Segments.push({ column: i });
      else r.Segments.push(i);
    });
    return r;
  }
}
