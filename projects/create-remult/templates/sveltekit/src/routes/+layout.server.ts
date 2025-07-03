import { remult } from "remult";
import type { LayoutServerLoad } from "./$types";

export const load = (async () => {
  return { user: remult.user };
}) satisfies LayoutServerLoad;
