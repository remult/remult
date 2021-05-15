import { Column } from "./column";
import { columnDefs } from "./column-interfaces";

import { EntityDefs } from "./remult3";

export class Sort {
  constructor(...segments: SortSegment[]) {
    this.Segments = segments;
  }
  Segments: SortSegment[];
  reverse() {
    let r = new Sort();
    for (const s of this.Segments) {
      r.Segments.push({ column: s.column, descending: !s.descending });
    }
    return r;
  }
}
export interface SortSegment {
  column: columnDefs,
  descending?: boolean
}
