import type { Framework } from "../FRAMEWORKS";
import fs from "fs";
import path from "path";
import { extractEnvironmentVariables } from "../extractEnvironmentVariables";
import { createReadmeFile, gatherInfo } from "./react";
import { writeImports } from "../writeImports";

export const svelteKit: Framework = {
  name: "sveltekit",
  display: "SvelteKit",
  componentFileSuffix: ".svelte",
  serverInfo: {
    remultServerFunction: "remultSveltekit",
    import: "remult-sveltekit",
    doesNotLikeJsFileSuffix: true,
    auth: {
      template: "sveltekit",
      dependencies: {
        "@auth/sveltekit": "^1.5.0",
      },
    },
    writeFiles: (args) => {
      const apiPath = path.join(args.root, "src/server/api.ts");

      fs.writeFileSync(
        apiPath,
        adjustEnvVariablesForSveltekit(fs.readFileSync(apiPath, "utf-8")),
      );
      var info = gatherInfo({ ...args, frontendTemplate: "sveltekit" });
      fs.writeFileSync(
        path.join(args.root, "src", "routes", "+page.svelte"),
        `<script>
  ${writeImports(info.imports, args.server).split("\n").join("\n  ")}
</script>

<h1>Welcome to ${args.projectName}!</h1>

<ul>
  ${info.li.map((l) => `<li>${l()}</li>`).join("\n  ")}
</ul>
`,
      );
      createReadmeFile(
        args.projectName,
        info.components,
        args.server,
        args.root,
      );
    },
  },
};

export function adjustEnvVariablesForSveltekit(content: string) {
  const envVars = extractEnvironmentVariables(content);
  if (envVars.length == 0) return content;
  let lines = content.split("\n");
  lines.splice(
    2,
    0,
    `import { ${envVars.join(", ")} } from "$env/static/private";`,
    `import { building } from "$app/environment";`,
  );

  return lines
    .join("\n")
    .replace(/process\.env\["(.*?)"\]/g, "$1")
    .replace(/dataProvider: /g, "dataProvider: building ? undefined : ");
}
