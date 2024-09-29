import { Entity, Fields, remult, repo, Validators } from "remult";
import type { hash } from "@node-rs/argon2";
import type { ProviderType } from "@auth/express/providers";
import { Roles } from "./Roles";

@Entity("users", {
  allowApiCrud: remult.authenticated, // Only authenticated users can perform CRUD operations
  allowApiDelete: Roles.admin, // Only admin users can delete
  allowApiInsert: Roles.admin, // Only admin users can create new entries
  apiPrefilter: () => {
    // Defines a prefilter to restrict data access based on user roles
    if (remult.isAllowed(Roles.admin)) return {}; // Admin can see all users
    return {
      id: remult.user!.id, // Non-admin users can only access their own data
    };
  },
})
export class User {
  @Fields.cuid()
  id = "";

  @Fields.string({ required: true, validate: Validators.unique() }) // User's name, required field and must be unique
  name = "";

  @Fields.string({ includeInApi: false }) // Password field is not exposed in API responses
  password = "";

  @Fields.string<User>({
    // This field is used for updating the password without exposing the actual password column
    serverExpression: () => "***", // Hides the value when retrieved from the server
    saving: async (user, fieldRef, e) => {
      if (e.isNew || fieldRef.valueChanged()) {
        // If the user is new or the password has changed
        user.password = await User.hashPassword(user.updatePassword); // Hash the new password using the injected hashing function
      }
    },
  })
  updatePassword = ""; // Placeholder field for password updates, not persisted directly

  @Fields.boolean({
    allowApiUpdate: Roles.admin, // Only admins can update this field
  })
  admin = false;

  @Fields.createdAt() // Automatically tracks when the user was created
  createdAt = new Date();

  @Fields.string({ includeInApi: Roles.admin }) // Only admins can see this
  providerType: ProviderType = "credentials";

  @Fields.string({ includeInApi: Roles.admin }) // Admins can see the OAuth provider (e.g., GitHub)
  provider = "";

  @Fields.string({ includeInApi: Roles.admin }) // Admins can see the user's provider account ID (e.g., GitHub user ID)
  providerAccountId = "";

  static hashPassword: typeof hash; // A static function for password hashing, injected in `auth.ts`

  // Creates demo users for testing purposes
  static async createDemoUsers() {
    if ((await repo(User).count()) == 0)
      // If no users exist, insert these demo users
      await repo(User).insert([
        {
          name: "Jane",
          updatePassword: "Jane123",
          admin: true, // Jane is an admin
          providerType: "credentials",
        },
        {
          name: "Steve",
          updatePassword: "Steve123",
          providerType: "credentials",
        },
      ]);
  }
}
