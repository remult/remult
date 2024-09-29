import { Entity, Fields } from "remult";

@Entity("tasks", {
  allowApiCrud: true,
})
export class Task {
  @Fields.cuid()
  id = "";

  @Fields.string()
  title = "";

  @Fields.boolean()
  completed = false;

  @Fields.createdAt()
  createdAt?: Date;
}
