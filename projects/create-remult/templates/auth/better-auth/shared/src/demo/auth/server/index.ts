import { Module } from "remult/server";
import { authEntities } from "../authEntities.js";
import { auth as authConfig } from "./auth.js";
import { remult } from "remult";
import { Role } from "../Roles.js";
import { addRolesToUser } from "./authHelpers.js";

export const auth = (o?: { SUPER_ADMIN_EMAILS?: string }) =>
  new Module({
    key: "auth",

    entities: Object.values(authEntities),

    initApi: async () => {
      // Add some roles to some users.
      const emails = (o?.SUPER_ADMIN_EMAILS ?? "")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      await addRolesToUser(emails, Object.values(Role));
    },

    initRequest: async () => {
      const s = await authConfig.api.getSession({
        headers: new Headers(remult.context.headers?.getAll()),
      });

      if (s) {
        const roles = s.user.roles;

        // Tweak the remult.user object.
        remult.user = {
          id: s.user.id,
          name: s.user.name,
          roles,
        };
      }
    },
  });
