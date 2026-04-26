import { Roles_Auth } from "./authEntities.js";

/** ALL ROLES of your application. [Learn more](https://remult.dev/docs/modules#roles) */
export const Roles = {
  SuperAdmin: "super-admin",
  ...Roles_Auth,
} as const;
