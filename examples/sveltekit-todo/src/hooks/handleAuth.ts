import { SvelteKitAuth } from "@auth/sveltekit";
import Credentials from "@auth/core/providers/credentials";
import type { UserInfo } from "remult";

const validUsers: UserInfo[] = [
  { id: "1", name: "Jane", roles: ["admin"] },
  { id: "2", name: "Steve" },
];
//Based on article at https://authjs.dev/reference/sveltekit
export const handleAuth = SvelteKitAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        name: {
          placeholder: "Try Steve or Jane",
        },
      },
      authorize: (info) =>
        validUsers.find((user) => user.name === info?.name) || null,
    }),
  ],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: validUsers.find((user) => user.id === token?.sub),
    }),
  },
});
