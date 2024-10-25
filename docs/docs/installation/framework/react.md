# React

## Create a React Project with Vite

To set up a new React project using Vite, run the following commands:

```sh
npm create vite@latest remult-react-project -- --template react-ts
cd remult-react-project
```

## Install Remult

Install the latest version of Remult:

```bash
npm install remult@latest
```

## Enable TypeScript Decorators in Vite

To enable the use of decorators in your React app, modify the `vite.config.ts` file by adding the following to the `defineConfig` section:

```ts{6-12}
// vite.config.ts

// ...
export default defineConfig({
  plugins: [react()],
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
      },
    },
  },
});
```

This configuration ensures that TypeScript decorators are enabled for the project.

## Proxy API Requests from Vite DevServer to the API Server

In development, your React app will be served from `http://localhost:5173`, while the API server will run on `http://localhost:3002`. To allow the React app to communicate with the API server during development, use Vite's [proxy](https://vitejs.dev/config/#server-proxy) feature.

Add the following proxy configuration to the `vite.config.ts` file:

```ts{6}
// vite.config.ts

//...
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:3002" } },
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
      },
    },
  },
});
```

This setup proxies all requests starting with `/api` from `http://localhost:5173` to your API server running at `http://localhost:3002`.

## Configure a Server

Now that the app is set up, [Select an API Server](../server/)
