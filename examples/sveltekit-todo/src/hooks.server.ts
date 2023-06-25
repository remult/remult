import { sequence } from "@sveltejs/kit/hooks";

import { handleAuth } from "./hooks/handleAuth";
import { handleRemult } from "./hooks/handleRemult";

export const handle = sequence(handleAuth, handleRemult);
