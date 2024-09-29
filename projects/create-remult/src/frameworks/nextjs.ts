import type { Framework } from "../FRAMEWORKS";
import fs from "fs";
import path from "path";
import { writeAppTsxAndReadme } from "./react";

export const nextJs: Framework = {
  name: "nextjs",
  display: "Next.js",

  envFile: ".env.local",
  serverInfo: {
    doesNotLikeJsFileSuffix: true,
    remultServerFunction: "remultNextApp",
    import: "remult-next",
    auth: {
      template: "nextjs",
      dependencies: { "next-auth": "^5.0.0-beta.21" },
    },
  },
  writeFiles: (args) => {
    const { root } = args;
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(root, "package.json"), "utf-8"),
    );
    let externalPackages: string[] = [];
    if (packageJson.dependencies["@node-rs/argon2"])
      externalPackages.push("@node-rs/argon2");
    if (packageJson.dependencies["knex"]) externalPackages.push("knex");

    if (externalPackages.length > 0) {
      fs.writeFileSync(
        path.join(root, "next.config.mjs"),
        `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [${externalPackages
      .map((x) => `"${x}"`)
      .join(",")}],
  },
};

export default nextConfig;
`,
      );
    }
    writeAppTsxAndReadme(args);
  },
};

export function removeJs(content: string) {
  const regex = /from\s+(['"])(.+)\.js\1/g;
  content = content.replace(regex, "from $1$2$1");
  return content;
}
