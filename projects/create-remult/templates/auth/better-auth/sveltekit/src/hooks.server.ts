import { sequence } from "@sveltejs/kit/hooks";
import { api as handleRemult } from "./server/api";
import { handleAuth } from "./demo/auth/server/handle";

export const handle = sequence(handleRemult, handleAuth);
