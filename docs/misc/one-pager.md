# Remult - a CRUD framework for full stack TypeScript

<img alt="GitHub license" src="https://img.shields.io/badge/license-MIT-blue.svg">
<img alt="npm version" src="https://badge.fury.io/js/remult.svg">
<img alt="npm downloads" src="https://img.shields.io/npm/dm/remult">
<img alt="GitHub stars" src="https://img.shields.io/github/stars/remult/remult?style=social">

<a href="https://github.com/remult/remult">GitHub</a> | 
<a href="https://remult.dev">Website</a> |
<a href="https://twitter.com/remultjs">Twitter</a> |
<a href="https://discord.gg/GXHk7ZfuG5">Discord</a>

## What is Remult?

**Remult** is a full-stack CRUD framework that uses your **TypeScript entities as a single source of truth for your API, frontend type-safe API client and backend ORM**.

Remult is **production-ready** and, in fact, used in production apps since 2018. However, we’re keeping the major version at zero so we can use community feedback to finalize the v1 API.

## Motivation

Full-stack web development is (still) too complicated. **Simple CRUD, a common requirement of any business application, should be simple to build, maintain, and extend** when the need arises.

Remult abstracts away repetitive, boilerplate, error-prone, and poorly designed code on the one hand, and enables total flexibility and control on the other. **Remult helps building fullstack apps using only TypeScript code you can easily follow and safely refactor**, and fits nicely into any existing or new project by being minimalistic and completely unopinionated regarding the developer’s choice of other frameworks and tools.

## Features

* **API Included** - Secure API is auto-generated from model TypeScript classes, and consumed by frontend type-safe queries. The generated API can also be used by apps & third-parties.

* **No Boilerplate** - Simple CRUD **from frontend to database** just works. Smart hooks make it super easy to control data transformation, validations and CRUD events.

* **Highly Declarative** - Model metadata and declarative code affect both frontend and backend, eliminating redundant, error-prone duplication.

* **Always Type-safe** - The same type-safe coding style can be used to find and manipulate data in both frontend and backend code. 

* **UI Framework Agnostic** - Use Remult together with React, Angular, Vue.js, or any other UI framework.

* **Easy Setup** - Bootstrap in minutes with an Express.js middleware in the backend and an http client wrapper in the frontend.

## Getting started
The best way to learn Remult is by following a tutorial of a simple Todo web app with a Node.js Express backend. 

* [Tutorial with React](https://remult.dev/tutorials/react/) 
* [Tutorial with Angular](https://remult.dev/tutorials/angular/)
* [Tutorial with Vue](https://remult.dev/tutorials/vue/)
* [Tutorial with Next.js](https://remult.dev/tutorials/react-next/)

## Documentation
The [documentation](https://remult.dev/docs) covers the main features of Remult. However, it is still a work-in-progress.

## Example Apps

* Fullstack TodoMVC example with React and Express. ([Source code](https://github.com/remult/TodoMVC-eample) | [CodeSandbox](https://codesandbox.io/s/github/remult/TodoMVC-example?file=/src/frontend/App.tsx))

* [CRM demo](https://github.com/remult/crm-demo) with a React + [MUI](https://mui.com) front-end and Postgres database.
