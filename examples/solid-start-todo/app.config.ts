import { defineConfig } from "@solidjs/start/config"

export default defineConfig({
  //@ts-ignore
  solid: {
    babel: {
      plugins: [
        ["@babel/plugin-proposal-decorators", { version: "legacy" }],
        ["@babel/plugin-transform-class-properties"],
      ],
    },
  },
})
