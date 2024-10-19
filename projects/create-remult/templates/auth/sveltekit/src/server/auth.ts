import { SvelteKitAuth, type SvelteKitAuthConfig } from "@auth/sveltekit";
import type { ProviderType } from "@auth/sveltekit/providers";
import Credentials from "@auth/sveltekit/providers/credentials";
import GitHub from "@auth/sveltekit/providers/github";
import type { RequestEvent } from "@sveltejs/kit";
import { repo, withRemult, type UserInfo } from "remult";
import bcrypt from "bcryptjs";
import { User } from "../demo/auth/User";
import { Roles } from "../demo/auth/Roles";

// Configuration for Auth.js
const authConfig: SvelteKitAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        name: {
          type: "text", // The input field for username
          placeholder: "Try Jane or Steve", // Instructional placeholder for demo purposes
        },
        password: {
          type: "password", // The input field for password
          placeholder: "Jane123 or Steve123", // Instructional placeholder for demo purposes
        },
      },
      authorize: (credentials) =>
        // This function runs when a user tries to sign in
        withRemult(async () => {
          // The withRemult function provides the current Remult context (e.g., repository, authenticated user, etc.)
          // to any Remult-related operations inside this block. This ensures that `remult` functions such as
          // repository queries or checking user permissions can be executed correctly within the request's context.
          const user = await repo(User).findFirst({
            // Find a user by their name and provider type (credentials-based auth)
            name: credentials.name as string,
            providerType: "credentials",
          });

          // If a matching user is found and the password is valid
          if (
            user &&
            bcrypt.compareSync(credentials.password as string, user.password)
          ) {
            return {
              id: user.id, // Return the user's ID as part of the session
            };
          }
          return null; // If credentials are invalid, return null
        }),
    }),
    GitHub,
  ],
  callbacks: {
    signIn: (arg) =>
      withRemult(async () => {
        // This callback runs after sign-in
        if (arg.account?.type === "credentials") return true; // If credentials-based login, allow sign-in
        let user = await repo(User).upsert({
          where: {
            // Find the user by OAuth provider and account ID
            provider: arg.account?.provider,
            providerType: arg.account?.type,
            providerAccountId: arg.account?.providerAccountId,
          },
          set: {
            name: arg.profile?.name || "", // Update the user's name with the OAuth profile name
          },
        });
        arg.user!.id = user.id; // Set the user's ID in the session
        return true;
      }),
    session: ({ session, token }) => {
      // Add the user's ID to the session object
      return {
        ...session,
        user: {
          id: token.sub, // Use the token's subject (user ID)
        },
      };
    },
  },
};
// Auth.js middleware for SvelteKit
export const { handle } = SvelteKitAuth(authConfig);
export type { ProviderType }; // Export ProviderType for use in `User.providerType`
export async function getUserFromRequest(
  req: RequestEvent,
): Promise<UserInfo | undefined> {
  const session = await req.locals.auth(); // Get the session from the request
  if (!session?.user?.id) return undefined; // If no session or user ID, return undefined
  const user = await repo(User).findId(session.user.id); // Find the user in the database by their session ID
  if (!user) return undefined; // If no user is found, return undefined
  return {
    id: user.id,
    name: user.name,
    roles: user.admin ? [Roles.admin] : [], // Return roles based on admin status
  };
}
