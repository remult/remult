import { Column } from "./column";

export class Sort {
    constructor(...segments: SortSegment[]) {
  
      this.Segments = segments;
    }
    Segments: SortSegment[];
  }
  export interface SortSegment {
    column: Column,
    descending?: boolean
  }
  