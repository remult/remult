import { NextRequest } from "next/server";
import { remultNextApp } from "remult/remult-next";
import { Task } from "../../../shared/task";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { UserInfo } from "remult";

export const api = remultNextApp({
  entities: [Task],
  // using next auth experimental version based on: https://codevoweb.com/setup-and-use-nextauth-in-nextjs-13-app-directory/
  getUser: async () =>
    (await getServerSession(authOptions))?.user as UserInfo

});

export const { POST, PUT, DELETE, GET, withRemult } = api;



