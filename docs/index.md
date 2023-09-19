---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "remult"
  text: "A CRUD framework for fullstack TypeScript"
  tagline: "Build Full-stack, End-to-end Type-safe CRUD Apps without the Boilerplate"
  image: 
    src: /logo.png
    alt: Remult
  actions:
    - theme: brand
      text: Get Started
      link: /docs/
    - theme: alt
      text: View on GitHub
      link: https://github.com/remult/remult

features:
  - title: API Included
    details: Secure API is auto-generated from model TypeScript classes, and consumed by frontend type-safe queries. The generated API can also be used by apps & third-parties.

  - title: No Boilerplate
    details: Simple CRUD from frontend to database just works. Smart hooks make it super easy to control data transformation, validations and CRUD events.

  - title: Highly Declarative
    details: Model metadata and declarative code affect both frontend and backend, eliminating redundant, error-prone duplication.

  - title: Always Type-safe
    details: The same type-safe coding style can be used to find and manipulate data in both frontend and backend code.

  - title: Easy Setup
    details: Bootstrap in minutes with an Express.js middleware in the backend and an http client wrapper in the frontend.
---