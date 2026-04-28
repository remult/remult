import { repo } from "remult";
import { User } from "../authEntities.js";

export const stringToArray = (s?: string): string[] =>
  (s ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

export const addRolesToUsers = async (emails: string[], roles: string[]) => {
  if (emails.length === 0 || roles.length === 0) return;

  const users = await repo(User).find({ where: { email: emails } });

  const userNotFounds = emails.filter((e) => !users.some((u) => u.email === e));
  for (const nf of userNotFounds) {
    console.info(`addRolesToUsers: User`, nf, "not found, roles", roles);
  }

  const usersAlreadyHaveRoles = [];
  for (const user of users) {
    const rolesToAdd = roles.filter((r) => !user.roles.includes(r));
    if (rolesToAdd.length > 0) {
      await repo(User).update(user.id, {
        roles: [...new Set([...user.roles, ...rolesToAdd])],
      });
      console.info(
        `addRolesToUsers: User`,
        user.email,
        "roles added",
        rolesToAdd,
      );
    } else {
      usersAlreadyHaveRoles.push(user.email);
    }
  }

  if (usersAlreadyHaveRoles.length > 0) {
    console.info(
      `addRolesToUsers: Users`,
      usersAlreadyHaveRoles,
      "already have roles",
      roles,
    );
  }
};
