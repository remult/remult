import type { envVariable, ServerInfo } from "../FRAMEWORKS";
import fs from "fs";
import path from "path";
import type { ComponentInfo } from "./prepareInfoReadmeAndHomepage";

export function createReadmeFile(
  projectName: string,
  components: ComponentInfo[],
  server: ServerInfo,
  root: string,
  envVariables: envVariable[],
) {
  components.unshift({
    display: "Remult",
    url: "https://remult.dev/",
    description: "Fullstack Type-safe CRUD & Realtime",
    emoji: "🚀",
  });
  const readme = `# ⚡️ ${projectName} ⚡️

Everything you need to build a great \`remult\` project, powered by [\`create-remult\`](https://github.com/remult/remult/tree/main/projects/create-remult).

### What's Included?

${components
  .map(
    ({ display, url, description, emoji }) =>
      `- ${emoji ? `${emoji} ` : ""}[${display}](${url})${
        description ? `: ${description} ` : ""
      }`,
  )
  .join("\n")}

### 🛠 Prerequisites

Before diving in, make sure you have the following tools installed:

- **Node.js (v20+ 🚨)**
- **npm (bundled with Node.js)**

### 🎯 Installation

Clone the repo:

${"```"}bash
git clone [YOUR REPO URL ONCE PUSHED]
${"```"}

and install dependencies:

${"```"}bash
npm install
${"```"}

${
  envVariables.length > 0
    ? `### 🛠 Configuration & Environment Variables

You'll need to set up some **environment variables** in your \`.env\` file. 
You can use [.env.example](./.env.example) as an example.
`
    : ""
}

### 🧑‍💻 Running the Dev Environment

${
  server.requiresTwoTerminal
    ? `To develop locally, you'll need to run both the frontend and backend environments. This requires **two terminal windows**.

1. In **Terminal 1**, run the frontend development server:

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
    : `Simply run the development server:

${"```"}bash
npm run dev
${"```"}`
}

### 🚢 Production-Ready

When you're ready to go live, here's how to prepare:

#### Build for production:

${"```"}bash
npm run build
${"```"}

#### Run the production server:

${"```"}bash
npm run start
${"```"}
`;
  fs.writeFileSync(path.join(root, "README.md"), readme);
}
