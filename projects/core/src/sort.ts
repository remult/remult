
import { CompoundIdField } from "./column";
import { FieldMetadata } from "./column-interfaces";
import { EntityMetadata, EntityOrderBy, SortSegments } from "./remult3";
export class Sort {
  constructor(...segments: SortSegment[]) {
    this.Segments = segments;
  }
  Segments: SortSegment[];
  reverse() {
    let r = new Sort();
    for (const s of this.Segments) {
      r.Segments.push({ field: s.field, isDescending: !s.isDescending });
    }
    return r;
  }
  static createSortOf<T>(entityDefs: EntityMetadata<T>): SortSegments<T> {
    let r = {};
    for (const c of entityDefs.fields) {
      r[c.key] = new sortHelper(c);
    }
    return r as SortSegments<T>;
  }
  static translateOrderByToSort<T>(entityDefs: EntityMetadata<T>, orderBy: EntityOrderBy<T>): Sort {
    if (!orderBy)
      return undefined;
    let entity = Sort.createSortOf(entityDefs);
    let resultOrder = orderBy(entity);//
    let sort: Sort;
    if (Array.isArray(resultOrder))
      sort = new Sort(...resultOrder);
    else {
      if (!resultOrder)
        return new Sort();
      sort = new Sort(resultOrder);
    }
    return sort;

  }
  static createUniqueSort<T>(entityMetadata: EntityMetadata<T>, orderBy: EntityOrderBy<T>): Sort {
    if (!orderBy)
      orderBy = entityMetadata.options.defaultOrderBy;
    if (!orderBy)
      orderBy = x => ({ field: entityMetadata.idMetadata.field })

    let sort = Sort.translateOrderByToSort(entityMetadata, orderBy);
    if (entityMetadata.idMetadata.field instanceof CompoundIdField) {
        for (const field of entityMetadata.idMetadata.field.fields) {
          if (!sort.Segments.find(x => x.field == field)) {
            sort.Segments.push({ field: field });
          }    
        }
    }
    else
      if (!sort.Segments.find(x => x.field == entityMetadata.idMetadata.field)) {
        sort.Segments.push({ field: entityMetadata.idMetadata.field });
      }
    return sort;
  }
}
export interface SortSegment {
  field: FieldMetadata,
  isDescending?: boolean
}

class sortHelper implements SortSegment {
  constructor(public field: FieldMetadata, public isDescending = false) {

  }
  descending(): SortSegment {
    return new sortHelper(this.field, !this.isDescending);
  }
}