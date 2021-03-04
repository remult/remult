import { Column } from "./column";
import { Entity } from "./entity";

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
  translateFor(e: Entity) {
    return new Sort(...this.Segments.map(c => ({ column: e.columns.find(c.column), descending: c.descending } as SortSegment)));
  }
}
export interface SortSegment {
  column: Column,
  descending?: boolean
}
