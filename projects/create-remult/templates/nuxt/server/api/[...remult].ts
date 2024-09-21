import { Entity, Fields } from "remult";
import { remultNuxt } from "remult/remult-nuxt";

@Entity("tasks", {
  allowApiCrud: true,
})
class Task {
  @Fields.string()
  id = "";
}

export const api = remultNuxt({
  entities: [Task],
  admin: true,
});

export default defineEventHandler(api);

console.log(123);
