import { Entity, Fields } from "remult";

@Entity<Task>("tasks", {
  allowApiCrud: true,
})
export class Task {
  @Fields.cuid()
  id = "";

  @Fields.string<Task>({
    validate: (item) => item.title.length > 2 || "Too short",
  })
  title = "";

  @Fields.boolean()
  completed = false;

  @Fields.createdAt()
  createdAt?: Date;
}
