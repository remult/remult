import type { Framework } from "../FRAMEWORKS";
import fs from "fs";
import path from "path";
import { createViteConfig } from "../utils/createViteConfig";
import { writeImports } from "../utils/writeImports";
import { prepareInfoReadmeAndHomepage } from "../utils/prepareInfoReadmeAndHomepage";
import { createReadmeFile } from "../utils/createReadmeFile";

export const vue: Framework = {
  name: "vue",
  display: "Vue",
  url: "https://v3.vuejs.org/",
  canWorkWithVitePluginExpress: true,
  componentFileSuffix: ".vue",
  writeFiles: (args) => {
    const { withAuth, root } = args;
    fs.writeFileSync(
      path.join(root, "vite.config.ts"),
      createViteConfig({
        framework: "vue",
        withAuth,
        withPlugin: false,
      }),
    );
    var info = prepareInfoReadmeAndHomepage({
      ...args,
      frontendTemplate: "vue",
    });
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
      args.envVariables,
    );
  },
};
