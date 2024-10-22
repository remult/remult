<script setup>
  import Example from '../components/Example.vue'
</script>

# Introduction

**Remult** is a fullstack CRUD framework that uses your TypeScript model types to provide:

- Secure REST API (highly configurable)
- Type-safe frontend API client
- Type-safe backend query builder

#### Use the same model classes for both frontend and backend code

With Remult it is simple to keep your code [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) and increase development speed and maintainability by defining a single TypeScript model class (for each domain object) and sharing it between your frontend and backend code.

As Remult is "aware" of the runtime context (frontend or backend), data validations and entity lifecycle hooks can be written in layer-agnostic TypeScript which will run, as needed, on either the frontend, the backend, or both.

## Choose Your Remult Learning Path

Explore the flexibility of Remult through different learning paths tailored to match your style and project needs.

### `Option A`: Start with the Interactive Online Tutorial

If you're new to Remult or prefer a guided, hands-on approach, we recommend starting with our [interactive online tutorial](https://learn.remult.dev). This tutorial will walk you through building a full-stack application step by step, providing immediate feedback and insights as you learn.

### `Option B`: Create a new Project

[`npm init remult@latest`](./creating-a-project.md)

### `Option C`: Follow a Step-by-step Tutorial

<br />
<br />

<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 5rem">
	<Example :react=true sizeIco=150 />
	<Example :angular=true sizeIco=150 />
	<Example :vue=true sizeIco=150 />
	<Example :svelte=true sizeIco=150 />
	<Example :nextjs=true sizeIco=150 />
	<Example :solid=true sizeIco=150 />
</div>

### `Option D`: Quickstart

Use this [Quickstart](./quickstart.md) guide to quickly setup and try out Remult or add Remult to an existing app.

### `Option E`: Browse Example Apps

[Example Apps](./example-apps.md)

### `Option F`: Video Tutorials

Check out these official [Remult video tutorials](https://youtube.com/playlist?list=PLlcnBwFkuOn166nXXxxfL9Hee-1GWlDSm&si=TDlwIFDLi4VMi-as).
