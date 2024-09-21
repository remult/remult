import NextAuth from "next-auth";
import type { UserInfo } from "remult";
import type { AuthConfig } from "@auth/core";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";

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

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);

export async function getUserFromRequest() {
  return (await auth())?.user as UserInfo;
}
