import { envVariable } from "./FRAMEWORKS.js";
import { ComponentInfo } from "./utils/prepareInfoReadmeAndHomepage.js";
import { Import } from "./utils/writeImports.js";

export type AuthInfo = {
  name: string;
  componentInfo: ComponentInfo;

  scripts?: Record<string, string>;
  devDependencies?: (server: string) => Record<string, string>;
  dependencies?: (server: string) => Record<string, string>;

  apiFiles?: {
    imports: Import[];
    serverArguments: string[];
  };

  envVariables?: envVariable[];
};

export const Auths: Record<"better-auth" | "none", AuthInfo | null> = {
  ["better-auth"]: {
    name: "better-auth",
    componentInfo: {
      display: "Better-Auth",
      url: "https://www.better-auth.com/",
      description:
        "The most comprehensive authentication framework for TypeScript.",
      emoji: "🔒",
    },

    scripts: {
      "auth:generate":
        "pnpx @better-auth/cli@latest generate --config ./src/demo/auth/server/auth.ts --output ./src/demo/auth/authEntities.ts -y",
    },
    devDependencies: () => {
      const d: Record<string, string> = {
        "@nerdfolio/remult-better-auth": "0.3.1",
        "better-auth": "1.2.12",
      };
      return d;
    },

    apiFiles: {
      imports: [
        {
          from: "../demo/auth/server/index.js",
          imports: ["auth"],
        },
      ],
      serverArguments: [
        `modules: [
  auth({
    // Add some roles to some users with env variable.
    // SUPER_ADMIN_EMAILS
  }),
]`,
      ],
    },

    envVariables: [
      {
        key: `BETTER_AUTH_SECRET`,
        value: generateSecret(),
        comment:
          "Secret key for authentication. (You can use Online UUID generator: https://www.uuidgenerator.net)",
      },
      {
        key: "GITHUB_CLIENT_ID",
        comment:
          "Github OAuth App ID & Secret see https://www.better-auth.com/docs/authentication/github",
        optional: true,
      },
      { key: "GITHUB_CLIENT_SECRET", optional: true },
      {
        key: "SUPER_ADMIN_EMAILS",
        comment:
          "List of emails that will be given all roles. (comma separated)",
        optional: true,
      },
    ],
  },
  // It's not that it's not defined, it's really null.
  none: null,
};

function generateSecret() {
  try {
    return crypto.randomUUID();
  } catch {
    return "something-secret-for-auth-cookie-signature";
  }
}
