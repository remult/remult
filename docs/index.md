---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
titleTemplate: Fullstack Type-safe CRUD & Realtime

head:
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:title
      content: Remult
  - - meta
    - property: og:image
      content: https://remult.dev/logo_sm.png
  - - meta
    - property: og:url
      content: https://remult.dev/
  - - meta
    - property: og:description
      content: Fullstack Type-safe CRUD & Realtime library
  - - meta
    - name: twitter:card
      content: summary_large_image

hero:
  name: 'remult'
  text: 'Fullstack Type-safe CRUD & Realtime'
  tagline: 'Boost your TypeScript stack with SSOT entities and say goodbye to boilerplate code.'
  image:
    src: /logo.png
    alt: Remult
  actions:
    - theme: brand
      text: 🚀 Online tutorial
      link: https://learn.remult.dev/
    - theme: alt
      text: View on GitHub
      link: https://github.com/remult/remult

features:
  - icon: 🔗
    title: API Included
    details: Secure API is auto-generated from model TypeScript classes, and consumed by frontend type-safe queries. The generated API can also be used by apps & third-parties.

  - icon: ✔️
    title: No Boilerplate
    details: Simple CRUD from frontend to database just works. Smart hooks make it super easy to control data transformation, validations and CRUD events.

  - icon: ⭐
    title: Framework Agnostic
    details: 'Use Remult with any UI framework, web framework or meta-framework, including: React, Vue, Svelte, Angular, Express, Fastify, NestJS, Next.js, SvelteKit...'

  - icon: 📋
    title: Highly Declarative
    details: Model metadata and declarative code affect both frontend and backend, eliminating redundant, error-prone duplication.

  - icon: 🛡️
    title: Always Type-safe
    details: The same type-safe coding style can be used to find and manipulate data in both frontend and backend code.

  - icon: ⚡
    title: Easy Setup
    details: Begin with just a middleware in your existing stack, and gradually enhance your app with Remult’s features. Add what you need, when you need it.
---
