
import { ColumnDefinitions } from "./column-interfaces";
export class Sort {
  constructor(...segments: SortSegment[]) {
    this.Segments = segments;
  }
  Segments: SortSegment[];
  reverse() {
    let r = new Sort();
    for (const s of this.Segments) {
      r.Segments.push({ column: s.column, isDescending: !s.isDescending });
    }
    return r;
  }
}
export interface SortSegment {
  column: ColumnDefinitions,
  isDescending?: boolean
}
