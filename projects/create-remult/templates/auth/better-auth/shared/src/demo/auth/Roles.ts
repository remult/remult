import { Role_Auth } from "./authEntities";

/**
 * Your central place to manage ALL ROLES of your application.
 * Import each modules roles here.
 *
 * @example
 * // Follow the convention below:
 * export const Role_ModuleX = {
 *   ModuleX_Admin: "modulex.admin",
 *   // ModuleX_Read_Stuff: "modulex.read-stuff",
 * } as const;
 *
 * // Add use it like this:
 * export const Role = {
 *   Admin: "admin",
 *   ...Role_ModuleX,
 * } as const;
 */
export const Role = {
  Admin: "admin",
  ...Role_Auth,
} as const;
