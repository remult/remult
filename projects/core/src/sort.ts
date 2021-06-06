
import { FieldDefinitions } from "./column-interfaces";
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
}
export interface SortSegment {
  field: FieldDefinitions,
  isDescending?: boolean
}
