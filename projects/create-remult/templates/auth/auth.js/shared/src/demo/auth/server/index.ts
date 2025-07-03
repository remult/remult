import { Module } from "remult/server";
import { User } from "../User.js";

export const auth = () =>
  new Module({
    key: "auth",
    entities: [User],
    initApi: async () => {
      await User.createDemoUsers();
    },
  });
