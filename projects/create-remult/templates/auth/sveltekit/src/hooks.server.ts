import { sequence } from "@sveltejs/kit/hooks";
import { api as handleRemult } from "./server/api";
import { handle as handleAuth } from "./server/auth";

export const handle = sequence(handleAuth, handleRemult);
