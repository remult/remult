<script setup>
  import Example from '../components/Example.vue'
</script>

# Creating a Remult Project

_The easiest way to start building a Remult app_

```bash
npm init remult@latest
```

Yes, that's it!
::: tip
Let us know how you liked the process! [@remultjs](https://twitter.com/RemultJs)
:::

## Demo

![npm init remult](/npm_init_remult.gif)

## What you get ?

<!-- Remult offers a streamlined project creation process that caters to over `180` different project flavors, ensuring you'll find the perfect setup for your needs. With just a few simple questions, you will get a fully functional Remult project up and running in no time.

Here's what you can expect: -->

### 1. **Tailored Setup**

Answer a few questions about your preferred tech stack and project requirements.

`Project name`: The name of your project _(it will create a folder with this name)_

`Choose your Framework` <Example :oneline=true :react=true :angular=true :vue=true :nextjs=true :svelte=true :nuxt=true />

`Choose your Web Server` _(if needed)_ <Example :oneline=true :express=true :fastify=true />

`Choose your Database` <Example :oneline=true :json=true :postgres=true :mysql=true :sqlite=true :mongodb=true :mssql=true />

`Authentication`: Do you want to add `auth.js` to your project directly ? including a complete implementation for `credentials` and `github` providers

`Add CRUD demo`: A comprehensive example of how to use an entity. It will show you how to create, read, update and delete data.

`Admin UI`: Will then be available at `/api/admin`

### 2. **Instant Configuration**

Based on your answers, Remult will configure the project with the best-suited options. With all combinations of frameworks, servers, databases and authentication, we manage more than `180 different project flavors`! We are missing yours? Let us know !

### 3. **Feature-Rich Demo**

Once you run your project, you'll be greeted with a comprehensive dashboard that showcases all of Remult's powerful features. It will look like this:

![Remult Dashboard](/create-remult.png)

Each tile is a fully functional example of a feature that you selected.

### 4. **Easy Eject**

Simply remove the demo folder to eject the demo components.
