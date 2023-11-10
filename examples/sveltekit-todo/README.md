## SvelteKit Todo Example

This is a [sveltekit](https://kit.svelte.dev/) app

## Getting Started

1. Download the source:

   ```bash
   npx degit remult/remult/examples/sveltekit-todo remult-sveltekit-todo
   cd remult-sveltekit-todo
   npm i
   ```

2. Create `.env.local` file with the following content
   ```
   AUTH_SECRET=something-secret
   ```
   or run
   ```bash
   echo AUTH_SECRET=something-secret > .env.local
   ```
3. Run development server
   ```bash
   npm run dev
   ```

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
