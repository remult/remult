<script setup>
  import Example from '../components/Example.vue'
</script>

# Creating a Remult Project

_The easiest way to start building a Remult app_

![npm init remult](../public/npm_init_remult.gif)

## How ?

```bash
npm init remult@latest
```

Yes, that's it!
::: tip
Let us know how you liked the process! [@remultjs](https://twitter.com/RemultJs)
:::

## What you get ?

<!-- Remult offers a streamlined project creation process that caters to over `180` different project flavors, ensuring you'll find the perfect setup for your needs. With just a few simple questions, you will get a fully functional Remult project up and running in no time.

Here's what you can expect: -->

### 1. **Tailored Setup**

Answer a few questions about your preferred tech stack and project requirements.

`Project name`: The name of your project _(it will create a folder with this name)_

`Framework` <Example :oneline=true :react=true :angular=true :vue=true :nextjs=true :svelte=true :nuxt=true />

`Web Server` _(if needed)_ <Example :oneline=true :express=true :fastify=true />

`Database` <Example :oneline=true postgres:=true sqlite:=true  />

`CRUD`: do you want CRUD operations for all entities?

`Authentication`: do you want to use the included authentication?

2. **Instant Configuration**: Based on your answers, Remult will configure the project with the best-suited options.
3. **Feature-Rich Demo**: Upon launching your new project, you'll be greeted with a comprehensive dashboard that showcases all of Remult's powerful features.
4. **Easy Customization**: If you want to start with a clean slate, simply remove the demo folder to eject the demo components.
