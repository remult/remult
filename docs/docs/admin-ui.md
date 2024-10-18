# Admin UI

Enjoy a fully featured Admin UI for your entities, you can do CRUD operations on your entities, view their relationships via the Diagram entry, and ensure secure management with the same validations and authorizations as your application.

## Enabling the Admin UI

Add the Admin UI to your application by setting the `admin` option to `true` in the remult configuration.

```ts
export const api = remultSveltekit({
  entities: [],
  admin: true, // Enable the Admin UI
})
```

### Accessing and Using the Admin UI

Navigate to `/api/admin` to access the Admin UI. Here, you can perform CRUD operations on your entities, view their relationships via the Diagram entry, and ensure secure management with the same validations and authorizations as your application.

![Remult Admin](/remult-admin.png)

### Features

- **CRUD Operations**: Directly create, update, and delete tasks through the Admin UI.
- **Entity Diagram**: Visualize relationships between entities for better data structure understanding.
- **Security**: Operations are secure, adhering to application-defined rules.

## Demo in video

Watch this quick demo to see the Remult Admin UI in action:

<iframe width="560" height="315" src="https://www.youtube.com/embed/u7KG_vklHyA" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

This video showcases the key features and functionality of the Remult Admin UI, giving you a practical overview of how it can streamline your entity management process.
