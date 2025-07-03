import type { Handle } from "@sveltejs/kit";
import { auth } from "./auth";
import { svelteKitHandler } from "better-auth/svelte-kit";

export const handleAuth: Handle = async ({ event, resolve }) => {
  return svelteKitHandler({ event, resolve, auth });
};
