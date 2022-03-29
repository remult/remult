
import { FieldType as FieldType, ValueListFieldType } from "../../remult3";

@ValueListFieldType()
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
@ValueListFieldType()
export class TestStatus {
  static open = new TestStatus();
  static closed = new TestStatus('cc');
  static hold = new TestStatus(undefined, 'hh');
  constructor(public id?: string, public caption?: string) { }
}
