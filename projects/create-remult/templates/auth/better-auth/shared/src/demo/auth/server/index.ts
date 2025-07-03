import { Module } from "remult/server";
import { authEntities } from "../authEntities.js";
import { auth as authConfig } from "./auth.js";
import { remult } from "remult";

export const auth = () =>
  new Module({
    key: "auth",
    entities: Object.values(authEntities),
    initApi: async () => {
      // await User.createDemoUsers();
    },
    initRequest: async (req) => {
      const s = await authConfig.api.getSession({
        headers: new Headers(remult.context.headers?.getAll()),
      });

      if (s) {
        remult.user = { id: s.user.id, name: s.user.name };
      }
    },
  });
