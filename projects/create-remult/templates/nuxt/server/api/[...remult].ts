import { Entity, Fields } from "remult";
import { remultApi } from "remult/remult-nuxt";

@Entity("tasks", {
  allowApiCrud: true,
})
class Task {
  @Fields.string()
  id = "";
}

export const api = remultApi({
  entities: [Task],
  admin: true,
});

export default defineEventHandler(api);

console.log(123);
