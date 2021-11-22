# Introduction 

**Remult** is a fullstack CRUD framework which uses your TypeScript model class structure and metadata to handle the flow of data all the way from your backend database to your frontend app, and vice versa. 

To do this, Remult provides the following core features:
1. Mapping database-agnostic model-based CRUD operations to database commands (like an ORM)
2. Automatically generating secured RESTful API endpoints for your Node.js backend
3. Handling frontend model-based queries and updates by calling the backend API


### Use the same model classes for both frontend and backend code
With Remult it is simple to keep your code DRY and increase development speed and maintainability by defining a single Typescript model class (for each domain object) and sharing it between your frontend and backend code. 

As Remult is "aware" of the runtime context (frontend or backend), data validations and entity lifecycle hooks can be written in layer-agnostic TypeScript which will run, as needed, on either the frontend, the backend, or both.

# Getting Started
Get started with Remult by following this [tutorial](./tutorial-react.md).