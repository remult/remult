import { Roles_Auth } from "./authEntities.js";

/** ALL ROLES of your application. */
export const Roles = {
  Admin: "admin",
  ...Roles_Auth,
} as const;
