# Next.js

## Create a Next.js Project

To create a new Next.js project, run the following command:

```sh
npx -y create-next-app@latest remult-nextjs
```

When prompted, use these answers:

```sh
✔ Would you like to use TypeScript? ... Yes
✔ Would you like to use ESLint? ... No
✔ Would you like to use Tailwind CSS? ... No
✔ Would you like to use `src/` directory? ... Yes
✔ Would you like to use App Router? (recommended) ... Yes
✔ Would you like to customize the default import alias? ... No
```

Afterward, navigate into the newly created project folder:

```sh
cd remult-nextjs
```

## Install Remult

Install the latest version of Remult:

```bash
npm install remult
```

## Bootstrap Remult in the Backend

Remult is bootstrapped in a Next.js app by creating a [catch-all dynamic API route](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes#catch-all-segments). This route will pass API requests to an object created using the `remultApi` function.

1. **Create an API file**

   In the `src/` directory, create a file called `api.ts` with the following code to set up Remult:

   ```ts
   // src/api.ts

   import { remultApi } from 'remult/remult-next'

   export const api = remultApi({})
   ```

2. **Create the API Route**

   In the `src/app/api` directory, create a `[...remult]` subdirectory. Inside that directory, create a `route.ts` file with the following code:

   ```ts
   // src/app/api/[...remult]/route.ts

   import { api } from '../../../api'

   export const { POST, PUT, DELETE, GET } = api
   ```

This file serves as a catch-all route for the Next.js API, handling all API requests by routing them through Remult.

## Enable TypeScript Decorators

To enable the use of decorators in your Next.js app, modify the `tsconfig.json` file. Add the following entry under the `compilerOptions` section:

```json{7}
// tsconfig.json

{
  ...
  "compilerOptions": {
    ...
    "experimentalDecorators": true // add this line
    ...
  }
}
```

## Run the App

To start the development server, open a terminal and run the following command:

```sh
npm run dev
```

Your Next.js app is now running with Remult integrated and listening for API requests.
