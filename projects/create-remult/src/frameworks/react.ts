import type { Framework, WriteFilesArgs } from "../FRAMEWORKS";
import fs from "fs";
import path from "path";
import { createViteConfig } from "../utils/createViteConfig";
import { writeImports } from "../utils/writeImports";
import { nextJs } from "./nextjs";
import { createReadmeFile } from "../utils/createReadmeFile";
import { prepareInfoReadmeAndHomepage } from "../utils/prepareInfoReadmeAndHomepage";

export const react: Framework = {
  name: "react",
  display: "React",
  url: "https://reactjs.org/",
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

  var { components, imports, li } = prepareInfoReadmeAndHomepage({
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
  createReadmeFile(projectName, components, server, root, args.envVariables);
  if (framework === nextJs)
    fs.writeFileSync(
      path.join(root, "src", "app", "page.tsx"),
      '"use client"\n' + homePage,
    );
  else fs.writeFileSync(path.join(root, "src", "App.tsx"), homePage);
}
