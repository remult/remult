import { sequence } from "@sveltejs/kit/hooks";
import { api as handleRemult } from "./server/api";

export const handle = sequence(
  // Manage your sequence of handlers here
  handleRemult,
);
