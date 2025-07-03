import { betterAuth } from "better-auth";
import { remultAdapter } from "@nerdfolio/remult-better-auth";
import { remult } from "remult";
import { authEntities } from "../authEntities";

export const auth = betterAuth({
  database: remultAdapter(remult, {
    authEntities,
  }),
  // config example:
  emailAndPassword: {
    enabled: true,
  },
});
