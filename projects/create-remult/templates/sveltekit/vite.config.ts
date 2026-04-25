import type { KIT_ROUTES } from "$lib/ROUTES";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, loadEnv } from "vite";
import { kitRoutes } from "vite-plugin-kit-routes";

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return {
    plugins: [sveltekit(), kitRoutes<KIT_ROUTES>()],
  };
});
