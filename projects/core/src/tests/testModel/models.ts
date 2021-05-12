
import { DataProvider } from "../../data-interfaces";

import { EntityClass, Context } from "../../context";
import { Entity, EntityOptions } from "../../entity";
import { NumberColumn } from "../../columns/number-column";
import { StringColumn } from "../../columns/string-column";
import { ValueListColumn } from "../../columns/value-list-column";

@EntityClass
export class Categories extends Entity {
  id = new NumberColumn({ dbName: 'CategoryID' });
  categoryName = new StringColumn();
  description = new StringColumn();
  categoryNameLength = new NumberColumn({
    serverExpression: () => this.categoryName.value ? this.categoryName.value.length : undefined
  });
  categoryNameLengthAsync = new NumberColumn({
    serverExpression: () => Promise.resolve(this.categoryName.value ? this.categoryName.value.length : undefined)
  });
  status = new StatusColumn();
  constructor(settings?: EntityOptions | string) {
    super(settings && !(settings instanceof Context) ? settings : {
      name: undefined,

      allowApiCRUD: true
    });

  }
}


export class Status {
  static open = new Status(0, "open");
  static closed = new Status(1, "closed");
  static hold = new Status(2, "hold");

  constructor(public id: number, public name: string) {

  }
  toString() {
    return this.name;
  }
}
export class StatusColumn extends ValueListColumn<Status> {
  constructor() {
    super(Status);
  }

}

export class TestStatus {
  static open = new TestStatus();
  static closed = new TestStatus('cc');
  static hold = new TestStatus(undefined, 'hh');
  constructor(public id?: string, public caption?: string) { }
}
export class TestStatusColumn extends ValueListColumn<TestStatus>{
  constructor() {
    super(TestStatus);
  }
}