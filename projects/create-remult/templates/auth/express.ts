import type { UserInfo } from "remult";
import { Request } from "express";
import type { AuthConfig } from "@auth/core";
import { ExpressAuth, getSession } from "@auth/express";
import Credentials from "@auth/express/providers/credentials";
import GitHub from "@auth/express/providers/github";

const authConfig: AuthConfig = {
  providers: [
    Credentials({
      credentials: {
        name: {},
      },
      authorize: async (credentials) => ({
        id: credentials.name as string,
        name: credentials.name as string,
      }),
    }),
    GitHub,
  ],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        id: token.sub,
        name: token.name,
      },
    }),
  },
};

export const auth = ExpressAuth(authConfig);
export async function getUserFromRequest(req: Request) {
  return (await getSession(req, authConfig))?.user as UserInfo;
}
