import { betterAuth } from "better-auth";
import { remultAdapter } from "@nerdfolio/remult-better-auth";
import { authEntities } from "../authEntities.js";

export const auth = betterAuth({
  database: remultAdapter({
    // When you `npm run auth:generate` you need to have `authEntities: {}`
    // It generates all entites needed for better-auth. You might need to check diffs in GIT.
    // Help: https://github.com/nerdfolio/remult-better-auth
    authEntities,
    // authEntities: {},
    usePlural: true,
  }),

  trustedOrigins: ["http://localhost:5173"],

  user: {
    additionalFields: {
      roles: { type: "string[]" },
    },
  },

  // config example:
  emailAndPassword: {
    enabled: true,
  },
});
