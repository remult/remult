import type { Framework } from "../FRAMEWORKS";
import fs from "fs";
import path from "path";
import { createReadmeFile, gatherInfo } from "./react";
import { writeImports } from "../writeImports";

export const nuxt: Framework = {
  name: "nuxt",
  display: "Nuxt",

  serverInfo: {
    display: "Nuxt",
    remultServerFunction: "remultNuxt",
    import: "remult-nuxt",
    path: "server/api/[...remult].ts",
    writeFiles: (args) => {
      const apiPath = path.join(args.root, "server/api/[...remult].ts");
      fs.writeFileSync(
        apiPath,
        fs
          .readFileSync(apiPath)
          .toString()
          .replace(/"\.\.\/demo/g, '"../../demo') +
          "\n\nexport default defineEventHandler(api);",
      );
      var info = gatherInfo({ ...args, frontendTemplate: "vue" });
      fs.writeFileSync(
        path.join(args.root, "src", "App.vue"),
        `<script setup lang="ts">
${writeImports(info.imports, args.server)}
</script>

<template>
  <h1>Welcome to ${args.projectName}!</h1>
  
  <ul>
    ${info.li.map((l) => `<li>${l()}</li>`).join("\n    ")}
  </ul>
</template>
`,
      );
      createReadmeFile(
        args.projectName,
        info.components,
        args.server,
        args.root,
      );

      args.copyDir(path.join(path.join(args.root, "src")), args.root);
      fs.rmSync(path.join(args.root, "src"), { recursive: true, force: true });
    },
  },
};
