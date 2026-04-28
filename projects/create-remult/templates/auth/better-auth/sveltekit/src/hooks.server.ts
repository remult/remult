import { sequence } from "@sveltejs/kit/hooks";
import { api as handleRemult } from "./server/api";
import { handleAuth } from "./modules/auth/server/handle";

export const handle = sequence(handleRemult, handleAuth);
