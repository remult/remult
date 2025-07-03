import type { Framework } from "../FRAMEWORKS";
import fs from "fs";
import path from "path";
import { extractEnvironmentVariables } from "../utils/extractEnvironmentVariables";
import { writeImports } from "../utils/writeImports";
import { prepareInfoReadmeAndHomepage } from "../utils/prepareInfoReadmeAndHomepage";
import { createReadmeFile } from "../utils/createReadmeFile";

export const svelteKit: Framework = {
  name: "sveltekit",
  display: "SvelteKit",
  url: "https://kit.svelte.dev/",
  componentFileSuffix: ".svelte",
  serverInfo: {
    name: "sveltekit",
    remultServerFunction: "remultApi",
    import: "remult-sveltekit",
    doesNotLikeJsFileSuffix: true,
    // auth: {
    //   template: "sveltekit",
    //   dependencies: {
    //     "@auth/sveltekit": "^1.5.0",
    //   },
    // },
    writeFiles: (args) => {
      const apiPath = path.join(args.root, "src/server/api.ts");

      fs.writeFileSync(
        apiPath,
        adjustEnvVariablesForSveltekit(fs.readFileSync(apiPath, "utf-8")),
      );
      var info = prepareInfoReadmeAndHomepage({
        ...args,
        frontendTemplate: "sveltekit",
      });
      fs.writeFileSync(
        path.join(args.root, "src", "routes", "+page.svelte"),
        `<script lang="ts">
  ${writeImports(info.imports, args.server).split("\n").join("\n  ")}
  import "../styles.css";
</script>
<div class="tiles">
  <Tile
    title="${args.projectName}"
    subtitle=""
    icon="remult"
    className="intro"
    status="Success"
    width="half"
  >
    <div class="tile__title">What's next?</div>
    <div class="button-row">
      <a class="button" href="https://learn.remult.dev/" target="_blank">
        Interactive Tutorial
      </a>
      <a class="button" href="https://remult.dev/docs" target="_blank">
        Documentation
      </a>
      <a class="button" href="https://github.com/remult/remult" target="_blank">
        Github
      </a>
    </div>
    <div class="intro__stack">
      ${info.components
        .map(
          (c) => `<div class="intro__stack-item">
        <span>${c.type}</span>
        ${c.display}
      </div>`,
        )
        .join("\n      ")}
    </div>
  </Tile>
  ${info.li.map((l) => `${l()}`).join("\n  ")}
</div>
`,
      );
      createReadmeFile(
        args.projectName,
        info.components,
        args.server,
        args.root,
        args.envVariables,
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
