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

export const Auths: Record<string, AuthInfo | undefined> = {
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
  ["auth.js"]: {
    name: "auth.js",
    componentInfo: {
      display: "Auth.js",
      url: "https://authjs.dev/",
      description: "Auth.js Authentication for the Web. Free and open source.",
      emoji: "🔒",
    },

    devDependencies: (server) => {
      const d: Record<string, string> = {
        bcryptjs: "^3.0.2",
      };

      if (server === "sveltekit") d["@auth/sveltekit"] = "^1.5.0";
      else if (server === "nextjs") d["next-auth"] = "^5.0.0-beta.21";
      else if (server === "express") d["@auth/express"] = "^0.6.1";
      else if (server === "express-vite") d["@auth/express"] = "^0.6.1";

      return d;
    },

    apiFiles: {
      imports: [
        {
          from: "../demo/auth/server/auth.js",
          imports: ["getUserFromRequest"],
        },
        {
          from: "../demo/auth/server/index.js",
          imports: ["auth"],
        },
      ],
      serverArguments: [`getUser: getUserFromRequest`, `modules: [auth()]`],
    },

    envVariables: [
      {
        key: `AUTH_SECRET`,
        value: generateSecret(),
        comment:
          "Secret key for authentication. (You can use Online UUID generator: https://www.uuidgenerator.net)",
      },
      {
        key: "AUTH_GITHUB_ID",
        comment:
          "Github OAuth App ID & Secret see https://authjs.dev/getting-started/providers/github",
        optional: true,
      },
      { key: "AUTH_GITHUB_SECRET", optional: true },
    ],
  },
  none: undefined,
};

function generateSecret() {
  try {
    return crypto.randomUUID();
  } catch {
    return "something-secret-for-auth-cookie-signature";
  }
}
