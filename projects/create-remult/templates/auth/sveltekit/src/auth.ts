import { SvelteKitAuth } from "@auth/sveltekit";
import type { UserInfo } from "remult";
import type { AuthConfig } from "@auth/core";
import Credentials from "@auth/sveltekit/providers/credentials";
import GitHub from "@auth/sveltekit/providers/github";
import type { RequestEvent } from "@sveltejs/kit";

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

export const { handle } = SvelteKitAuth(authConfig);

export async function getUserFromRequest(req: RequestEvent) {
  return (await req.locals.auth())?.user as UserInfo;
}
