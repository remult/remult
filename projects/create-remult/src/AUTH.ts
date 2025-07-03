import { ComponentInfo } from "./utils/prepareInfoReadmeAndHomepage.js";

export type AuthInfo = {
  name: string;
  componentInfo?: ComponentInfo;

  dependencies?: (server: string) => Record<string, string>;
  devDependencies?: (server: string) => Record<string, string>;
};

export const Auths: Record<string, AuthInfo | undefined> = {
  // ["better-auth"]: {
  //   name: "better-auth",
  //   componentInfo: {
  //     display: "Better-Auth",
  //     url: "https://www.better-auth.com/",
  //     description:
  //       "The most comprehensive authentication framework for TypeScript.",
  //     emoji: "🔒",
  //   },
  // },
  ["auth.js"]: {
    name: "auth.js",
    componentInfo: {
      display: "Auth.js",
      url: "https://authjs.dev/",
      description: "Auth.js Authentication for the Web. Free and open source.",
      emoji: "🔒",
    },

    dependencies: (server) => {
      const d: Record<string, string> = {
        bcryptjs: "^2.4.3",
      };
      if (server === "sveltekit") d["@auth/sveltekit"] = "^1.5.0";
      if (server === "nextjs") d["next-auth"] = '"^5.0.0-beta.21"';
      return d;
    },
    devDependencies: () => {
      const d = {
        "@types/bcryptjs": "^2.4.6",
      };
      return d;
    },
  },
  none: undefined,
};
