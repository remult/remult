import { Column } from "./column";

export class ColumnHashSet {
    private _names: string[] = [];
    add(...columns: Column<any>[]) {
      if (columns)
        for (let c of columns)
          this._names.push(c.__getMemberName());
    }
    contains(column: Column<any>) {
      return this._names.indexOf(column.__getMemberName()) >= 0;
    }
  }
  