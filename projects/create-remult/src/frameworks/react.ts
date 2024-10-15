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
    <div className="tiles">
      <Tile
        title="${projectName}"
        subtitle=""
        icon="remult"
        className="intro"
        status="Success"
        width="half"
      >
        <div className="tile__title">What's next?</div>
        <div className="button-row">
          <a
            className="button"
            href="https://learn.remult.dev/"
            target="_blank"
          >
            Interactive Tutorial
          </a>
          <a className="button" href="https://remult.dev/docs" target="_blank">
            Documentation
          </a>
          <a
            className="button"
            href="https://github.com/remult/remult"
            target="_blank"
          >
            Github
          </a>
        </div>
        <div className="tile__subtitle"> Technology Stack Info:</div>
        <div className="intro__stack">
          ${components
            .map(
              (c) => `<div className="intro__stack-item">
            <span>${c.type}</span>
            ${c.display}
          </div>`,
            )
            .join("\n          ")}
        </div>
      </Tile>
      ${li.map((l) => `${l()}`).join("\n      ")}
    </div>
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
