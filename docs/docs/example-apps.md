<script setup>
  import Example from '../components/Example.vue'
</script>

# Example Apps

We have already a _ton_ of examples! Pick and choose the one that fits your needs 😊

## Todo MVC

<Example
	imgSrc="/example-apps/todoMVC.png"
 	:react=true :vite=true :express=true 
	github="https://github.com/remult/TodoMVC-example"
	codesandbox="https://codesandbox.io/s/github/remult/TodoMVC-example?file=/src/frontend/App.tsx"
/>

## CRM Demo

A fully featured CRM! Make sure to check out the link: <b>Dev / Admin</b> on top right!
<Example
	imgSrc="/example-apps/CRM.png"
 	:react=true :vite=true :express=true :postgres=true :mui=true
	live="https://crm-demo.up.railway.app/"
	github="https://github.com/remult/crm-demo"
/>

## Shadcn React Table

Using remult with server side sorting, filtering, paging & CRUD
<Example
	imgSrc="/example-apps/shadcn.png"
 	:react=true :vite=true :express=true :postgres=true :shadcn=true
	live="https://table.up.railway.app/"
	github="https://www.github.com/remult/remult/tree/main/examples/shadcn-react-table"
	stackblitz="https://stackblitz.com/github/remult/remult/tree/main/examples/shadcn-react-table"
/>

## TanStack React Table

Example of using remult with react table - most basic design, with server side sorting, paging & filtering
<Example
	title='TanStack React Table'
	imgSrc="/example-apps/tanStack.png"
 	:react=true :vite=true :tanstack=true
	github="https://www.github.com/remult/remult/tree/main/examples/tanstack-react-table"
	stackblitz="https://stackblitz.com/github/remult/remult/tree/main/examples/tanstack-react-table"
/>

## 🚀 Ready to play

An environment to reproduce issues using stackblitz, with optional sqlite database
<Example
	imgSrc="/example-apps/ready-to-play.png"
 	:react=true :vite=true :sqlite=true :express=true
	github="https://www.github.com/noam-honig/ready-to-play"
	stackblitz="https://stackblitz.com/github/noam-honig/ready-to-play"
/>

## Group by Example

And example of the usage of groupBy
<Example
	imgSrc="/example-apps/groupby.png"
 	:react=true :vite=true :express=true
	github="https://github.com/remult/remult/examples/groupBy"
	stackblitz="https://stackblitz.com/github/remult/remult/tree/main/examples/groupBy?file=src%2Ffrontend%2Fpage.tsx"
/>

## Todo for most frameworks

<Example :oneline=true :react=true :nextjs=true :angular=true :vue=true :svelte=true :solid=true :bun=true />

- [React & Express](https://github.com/remult/remult/tree/main/examples/react-todo)
- [React & bun & Hono](https://github.com/remult/remult/tree/main/examples/bun-react-hono-monorepo-todo)
- [Next.js (App Router)](https://github.com/remult/remult/tree/main/examples/nextjs-app-router-todo)
- [Next.js (Pages)](https://github.com/remult/remult/tree/main/examples/nextjs-todo)
- [Angular & Express](https://github.com/remult/remult/tree/main/examples/angular-todo)
- [Angular & Fastify](https://github.com/remult/remult/tree/main/examples/angular-todo-fastify)
- [Vue](https://github.com/remult/remult/tree/main/examples/vue-todo)
- [Nuxt3](https://github.com/remult/remult/tree/main/examples/nuxt-todo)
- [SvelteKit](https://github.com/remult/remult/tree/main/examples/sveltekit-todo)
- [SolidStart](https://github.com/remult/remult/tree/main/examples/solid-start-todo)

## Other example

- [Using BackendMethod queued option](https://stackblitz.com/edit/github-vwfkxu?file=src%2FApp.tsx)
- [Using SubscriptionChannel to update the frontend](https://stackblitz.com/edit/github-3nmwrp?file=src%2FApp.tsx)
- [Next.js Auth with remult user table](https://github.com/noam-honig/nextjs-auth-remult-user-table)
- [Unit tests for api](https://stackblitz.com/edit/api-test-example?file=test.spec.ts,model.ts)
