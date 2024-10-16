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
  <div class="tiles">
    <Tile
      title="${args.projectName}"
      subtitle=""
      icon="remult"
      class="intro"
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
        <a
          class="button"
          href="https://github.com/remult/remult"
          target="_blank"
        >
          Github
        </a>
      </div>
      <div class="tile__subtitle">Technology Stack Info:</div>
      <div class="intro__stack">
        ${info.components
          .map(
            (c) => `<div class="intro__stack-item">
          <span>${c.type}</span>
          ${c.display}
        </div>`,
          )
          .join("\n        ")}
      </div>
    </Tile>
    <ServerStatus />
    <Auth />
    <Admin />
    <Todo />
  </div>
</template>`,
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
