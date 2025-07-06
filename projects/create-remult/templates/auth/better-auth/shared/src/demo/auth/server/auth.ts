import { betterAuth } from "better-auth";
import { remultAdapter } from "@nerdfolio/remult-better-auth";
import { remult } from "remult";
import { authEntities } from "../authEntities.js";

export const auth = betterAuth({
  database: remultAdapter(remult, {
    authEntities,
    usePlural: true,
  }),
  // config example:
  emailAndPassword: {
    enabled: true,
  },
});
