
import { CompoundIdField } from "./column";
import { FieldDefinitions } from "./column-interfaces";
import { EntityDefinitions, EntityOrderBy, sortOf } from "./remult3";
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
  static createSortOf<T>(entityDefs: EntityDefinitions<T>): sortOf<T> {
    let r = {};
    for (const c of entityDefs.fields) {
      r[c.key] = new sortHelper(c);
    }
    return r as sortOf<T>;
  }
  static translateOrderByToSort<T>(entityDefs: EntityDefinitions<T>, orderBy: EntityOrderBy<T>): Sort {
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
  static createUniqueSort<T>(entityDefs: EntityDefinitions<T>, orderBy: EntityOrderBy<T>): Sort {
    if (!orderBy)
      orderBy = entityDefs.evilOriginalSettings.defaultOrderBy;
    if (!orderBy)
      orderBy = x => ({ field: entityDefs.idField })

    let sort = Sort.translateOrderByToSort(entityDefs, orderBy);
    if (entityDefs.idField instanceof CompoundIdField) {
        for (const field of entityDefs.idField.fields) {
          if (!sort.Segments.find(x => x.field == field)) {
            sort.Segments.push({ field: field });
          }    
        }
    }
    else
      if (!sort.Segments.find(x => x.field == entityDefs.idField)) {
        sort.Segments.push({ field: entityDefs.idField });
      }
    return sort;
  }
}
export interface SortSegment {
  field: FieldDefinitions,
  isDescending?: boolean
}

class sortHelper implements SortSegment {
  constructor(public field: FieldDefinitions, public isDescending = false) {

  }
  descending(): SortSegment {
    return new sortHelper(this.field, !this.isDescending);
  }
}