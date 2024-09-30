import type { ServerInfo } from "../FRAMEWORKS";
import fs from "fs";
import path from "path";
import type { ComponentInfo } from "./prepareInfoReadmeAndHomepage";

export function createReadmeFile(
  projectName: string,
  components: ComponentInfo[],
  server: ServerInfo,
  root: string,
  envVariables: string[],
) {
  const readme = `# ${projectName}

## Getting Started

### Includes

${components.map(({ display, url }) => `- [${display}](${url})`).join("\n")}


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

${
  server.requiresTwoTerminal
    ? `To develop locally, you'll need to run both the frontend and backend environments. This requires two terminal windows.

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
    : `1. run the development server:

   ${"```"}bash
   npm run dev
   ${"```"}`
}

${
  envVariables.length > 0
    ? `## Environment Variables

${envVariables.map((v) => `- ` + v).join("\n")}

`
    : ""
}### Additional Scripts

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
