---
llm: 'Built-in /api/admin CRUD UI with entity diagram, gated by allow and configurable via the admin option.'
---

# Admin UI

Enjoy a fully featured Admin UI for your entities, you can do CRUD operations on your entities, view their relationships in the Schema diagram, and ensure secure management with the same validations and authorizations as your application.

## Enabling the Admin UI

Add the Admin UI to your application by setting the `admin` option to `true` in the remult configuration.

```ts
export const api = remultApi({
  entities: [],
  admin: true, // Enable the Admin UI
})
```

### Tunning the Admin UI

You can pass some options to admin as well:

- `allow`, using [allowed](https://remult.dev/docs/access-control). `true`, `"admin"`, ...
- `customHtmlHead`, to add custom html to the head of the admin page. It's a function that receives remult as an argument.
- `requireAuthToken`, this will open settings dialog to set the bearer token directly.
- `disableLiveQuery`, this will disable live query for the admin ui. (can be overridden in the admin ui settings)

Example:

```ts
export const api = remultApi({
  entities: [],
  admin: {
    allow: 'admin', // Only for user having the "admin" role
    customHtmlHead: (r) =>
      `<title>Nice Admin! (${r.user?.name ?? 'Anonymous'})</title>
       <link href="https://remult.dev/favicon.png" rel="icon" type="image/png">`,
  },
})
```

### Choosing which entities to show

`entities` is called for each entity with its metadata and the request's `remult`. Return `false` to hide it, `true` for the defaults, or an object to override them (`editMode`: `'inline'` by default or `'drawer'`, `lockEditMode`: hide the edit mode switch).

```ts
admin: {
  allow: Allow.authenticated,
  entities: (entity, remult) => {
    if (remult.isAllowed('admin')) return true
    if (!['tasks', 'contacts'].includes(entity.key)) return false
    return { editMode: 'drawer', lockEditMode: true }
  },
}
```

This only filters the UI, it is not security. Hidden entities stay reachable through the API and as relations of visible entities. Use `allowApi*` to restrict access.

### Permission-aware UI

The admin UI follows your `allowApiInsert`, `allowApiUpdate` and `allowApiDelete` rules: actions the current user can't perform are hidden. A rule that is a function stays open in the UI, the server decides on save.

The home page and **Your access** (bottom of the side nav) show, per entity, what the signed in user can do, as CRUD: create, read, update and delete. Each is allowed, not allowed, or a function. Rules are evaluated for this user: the UI only learns the kind of rule (a boolean, a role `R`, a list of roles `R[]` or a function `ƒ`), never the role names. **Read (prefilter)** shows a funnel when `apiPrefilter` narrows the rows for this user (a prefilter returning `{}`, for an admin say, is off). Your access also shows the user (name, id, roles).

## Accessing and Using the Admin UI

Navigate to `/api/admin`. Every request goes through your API, so the admin uses the same validations and authorizations as your application, for the signed in user.

## Features

- **Entities**: the side nav lists your entities (filter with `/`). `Ctrl+K` (`⌘K` on macOS) jumps to an entity, the schema or the settings.
- **Table**: sort, paging, row count and live updates (live query). An entity the user can't read shows as Forbidden.
- **Edit inline or in a drawer**: edit cells in the table and save each row (`Ctrl+Enter`, add `Shift` for all rows, `Esc` to cancel), or open a row in a side drawer. Edited cells are marked with their previous value, a bar counts the edited rows with `Save all` and `Cancel all`, and a saved or reverted row flashes. Switch per entity, or set it with the `entities` hook.
- **Filters in the URL**: filter by text, number, date range, value list or relation. Filters, sort and page live in the URL, so `Copy link` shares the exact view.
- **Relations**: to-one fields show the related row's caption and are edited with a search. To-many relations open under a row as tabs of nested tables, and a new row there is prefilled with its parent.
- **Permission-aware**: actions the user can't perform are hidden (see [Permission-aware UI](#permission-aware-ui)).
- **Schema**: an entity relationship diagram with automatic layouts. Drag entities to arrange them, positions are kept in the browser.
- **Settings**: rows per page, confirm delete, captions or keys, theme (system, light or dark), live query, and the connection: a bearer token (kept for the tab only), a `localStorage` key to read the token from, and custom headers.

## Demo in video

Watch this quick demo to see the Remult Admin UI in action:

<iframe width="560" height="315" src="https://www.youtube.com/embed/u7KG_vklHyA" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

This video showcases the key features and functionality of the Remult Admin UI, giving you a practical overview of how it can streamline your entity management process.
