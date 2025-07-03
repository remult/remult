import type { Framework } from "../FRAMEWORKS";
import fs from "fs";
import path from "path";
import { writeAppTsxAndReadme } from "./react";

export const nextJs: Framework = {
  name: "nextjs",
  display: "Next.js",
  url: "https://nextjs.org/",

  envFile: ".env.local",
  serverInfo: {
    name: "nextjs",
    doesNotLikeJsFileSuffix: true,
    remultServerFunction: "remultApi",
    import: "remult-next",
    // auth: {
    //   template: "nextjs",
    //   dependencies: { "next-auth": "^5.0.0-beta.21" },
    // },
  },
  writeFiles: (args) => {
    const { root } = args;
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(root, "package.json"), "utf-8"),
    );
    let externalPackages: string[] = [];
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
    if (args.withAuth) {
      const checkAuthPath = path.join(root, "src/demo/auth/Auth.tsx");
      fs.writeFileSync(
        checkAuthPath,
        fs
          .readFileSync(checkAuthPath)
          .toString()
          .replace(/href="\/auth\/sign/g, 'href="/api/auth/sign'),
      );
    }
  },
};

export function removeJs(content: string) {
  const regex = /from\s+(['"])(.+)\.js\1/g;
  content = content.replace(regex, "from $1$2$1");
  return content;
}
