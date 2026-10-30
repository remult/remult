import type { LayoutLoad } from "./$types";

export const load = (async (event) => {
  return { user: event.data.user };
}) satisfies LayoutLoad;
