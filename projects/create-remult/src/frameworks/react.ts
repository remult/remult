import type { Framework, ServerInfo, WriteFilesArgs } from "../FRAMEWORKS";
import fs from "fs";
import path from "path";
import { createViteConfig } from "../createViteConfig";
import { writeImports, type Import } from "../writeImports";
import type { DatabaseType } from "../DATABASES";
import { nextJs } from "./nextjs";
import { svelteKit } from "./sveltekit";

export const react: Framework = {
  name: "react",
  display: "React",
  canWorkWithVitePluginExpress: true,
  writeFiles: (args) => {
    fs.writeFileSync(
      path.join(args.root, "vite.config.ts"),
      createViteConfig({
        framework: "react",
        withAuth: args.withAuth,
        withPlugin: false,
      }),
    );
    writeAppTsxAndReadme(args);
  },
};
export function writeAppTsxAndReadme(args: WriteFilesArgs) {
  const { root, server, framework, projectName } = args;

  var { components, imports, li } = gatherInfo({
    ...args,
    frontendTemplate: "react",
  });

  const homePage = `${writeImports(imports, server)}

export default function ${framework === nextJs ? "Home" : "App"}() {
  return (
    <>
      Welcome to ${projectName}
      <ul>
        ${li.map((l) => `<li>${l()}</li>`).join("\n        ")}
      </ul>
    </>
  );
}
`;
  createReadmeFile(projectName, components, server, root);
  if (framework === nextJs)
    fs.writeFileSync(
      path.join(root, "src", "app", "page.tsx"),
      '"use client"\n' + homePage,
    );
  else fs.writeFileSync(path.join(root, "src", "App.tsx"), homePage);
}
export function gatherInfo(
  args: WriteFilesArgs & { frontendTemplate: string },
) {
  let {
    withAuth,
    root,
    server,
    templatesDir,
    copyDir,
    crud,
    framework,
    db,
    admin,
    frontendTemplate,
  } = args;

  let components: string[] = [framework.display];
  if (framework.canWorkWithVitePluginExpress) {
    components.push("Vite");
    if (server.display) components.push(server.display);
  }
  components.push(db.display);

  const imports: Import[] = [];
  const li: (() => string)[] = [() => components.join(", ")];

  if (server.requiresTwoTerminal) {
    copyDir(
      path.join(templatesDir, "check-server", frontendTemplate),
      path.join(root),
    );
    imports.push({
      from: "./demo/CheckServer" + (framework.componentFileSuffix ?? ""),
      imports: "CheckServer",
    });
    li.push(() => "<CheckServer/>");
  }
  if (withAuth) {
    copyDir(path.join(templatesDir, "auth", frontendTemplate), path.join(root));

    components.push("auth.js");
    imports.push({
      from: "./demo/auth/CheckAuth" + (framework.componentFileSuffix ?? ""),
      imports: "CheckAuth",
    });
    li.push(() => "<CheckAuth/>");
  }
  if (admin) li.push(() => `Admin: <a href="/api/admin">Admin</a>`);
  if (crud) {
    copyDir(path.join(templatesDir, "crud", frontendTemplate), path.join(root));
    imports.push({
      from: "./demo/todo/Todo" + (framework.componentFileSuffix ?? ""),
      imports: "Todo",
    });
    li.push(() => "<Todo/>");
  }
  components.push("remult");
  if (server.doesNotLikeJsFileSuffix) {
    for (const i of imports) {
      if (i.from.startsWith("./demo")) i.from = "." + i.from;
    }
  }
  return { components, imports, li };
}

export function createReadmeFile(
  projectName: string,
  components: string[],
  server: ServerInfo,
  root: string,
) {
  const readme = `# ${projectName}

## Getting Started

### Includes

${components.map((c) => `- ` + c).join("\n")}


### Prerequisites

Make sure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (v20 or later)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1. Install dependencies:

   ${"```"}bash
   npm install
   ${"```"}

### Running the Development Environment

To develop locally, you'll need to run both the frontend and backend environments. This requires two terminal windows.

${
  server.requiresTwoTerminal
    ? `1. In **Terminal 1**, run the frontend development server:

   ${"```"}bash
   npm run dev
   ${"```"}

   This will start the frontend development environment and automatically open your app in the browser.

2. In **Terminal 2**, run the backend development server:

   ${"```"}bash
   npm run dev-node
   ${"```"}

   This will start the backend in watch mode, automatically restarting on code changes.
`
    : `1. run the development server:

   ${"```"}bash
   npm run dev
   ${"```"}`
}
### Additional Scripts

- **Build for production**:

  ${"```"}bash
  npm run build
  ${"```"}

- **Start the production server**:

  ${"```"}bash
  npm run start
  ${"```"}

`;
  fs.writeFileSync(path.join(root, "README.md"), readme);
}
