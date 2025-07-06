import { remult } from "remult";
import type { LayoutLoad } from "./$types";

export const load = (async (event) => {
  remult.useFetch(event.fetch);
  return { user: event.data.user };
}) satisfies LayoutLoad;
