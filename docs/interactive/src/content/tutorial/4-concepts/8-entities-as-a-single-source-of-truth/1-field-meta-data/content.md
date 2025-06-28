---
type: lesson
title: Field Metadata
focus: /shared/Task.ts
template: metadata
---

# Field Metadata

Entities in Remult are not just a single source of truth for storage, APIs, and authentication—they can serve as a central point for managing any entity-related aspect across your application. Let’s explore how to utilize field metadata for consistent UI labeling and data formatting.

### Setting Labels

To ensure consistent labels across your app, set the `label` attribute directly in the field definition. This way, the same label is automatically used wherever the field appears.

```file:/shared/Task.ts title="shared/Task.ts" collapse={1-6,16-100} add={12}

```

### Accessing Labels

Field metadata, like `label`, can be accessed using the `fields` property of a repository:

```typescript
const titleLabel = repo(Task).fields.title.label
console.log(titleLabel) // Outputs: "The Task Title"
```

Using labels this way allows for a unified UI. For example, in `TodoItem.tsx`:

```file:/frontend/TodoItem.tsx title="frontend/TodoItem.tsx" collapse={15-100} add={6,13}

```

Try changing the label of `title` in `Task` and observe how the UI updates automatically!

## Display Consistency with `displayValue`

To ensure consistent display formatting, especially for literals or dates, use the `displayValue` property.

### Example 1: Displaying a Literal Field

For fields with literal values, like `priority`, `displayValue` can ensure consistent capitalization:

```file:/shared/Task.ts title="shared/Task.ts" collapse={1-6,8-14,23-100} add={18-19}

```

In `TodoItem.tsx`, access and use this display formatting:

```file:/frontend/TodoItem.tsx title="frontend/TodoItem.tsx" collapse={1-14,19-100} add={17}

```

### Example 2: Displaying Dates with Reusable `displayValue`

Let’s take a closer look at defining `displayValue` for dates:

```file:/shared/Task.ts title="shared/Task.ts" collapse={1-6,8-25} add={28}

```

In this example, the `displayValue` function is designed to ignore the first parameter (representing the entity) and only use the second parameter, the date value. By focusing on the value alone, this `displayValue` function can be refactored into a standalone utility that works for any date field, not just `createdAt`.

#### Refactoring `displayValue` for Reusability

You can create a reusable `displayDate` function and use it across different date fields:

```typescript
// utils/displayValueHelpers.ts
export const displayDate = (_: unknown, date?: Date) =>
  date?.toLocaleDateString()
```

Now, any date field can use this `displayDate` function for consistent date formatting, regardless of the entity:

```typescript
import { displayDate } from './utils/displayValueHelpers'

@Fields.createdAt({
  label: 'Task Creation Date',
  displayValue: displayDate,
})
createdAt?: Date
```

This approach ensures consistency in date formatting across your application and keeps your code clean and maintainable. You can define similar reusable functions for other field types, ensuring that formatting stays uniform across different entities and fields.

### Extending Field Options with Custom Options

Beyond the standard options, fields can also be enhanced with **custom options** tailored to your application's specific needs. These options allow you to store and access any metadata you might need directly within the field definition, making your entity models even more powerful and adaptable.

For example, you might want to add a custom validation message, tooltip, or any other metadata to a field. This added flexibility helps you centralize and standardize additional properties that can be useful in various parts of your application, from dynamic UI rendering to custom business logic.

To explore more about how to define and use custom options, check out [Enhancing Field and Entity Definitions with Custom Options](https://remult.dev/docs/custom-options#enhancing-field-and-entity-definitions-with-custom-options).

## Leveraging Metadata for Dynamic UI

With field metadata, you can abstract your UI components for consistent display across your app. Here’s an example of a dynamic component that uses field metadata:

```solution:/frontend/TodoItem.tsx title="frontend/TodoItem.tsx" add={6-10,14-19}

```

Click **"Solve"** at the top right of the code editor to see this abstraction in action. This dynamic UI approach ensures your fields are displayed with the same metadata-defined labels and formatting throughout the app.

---

you can use the `getValueList` function to get the values of a literal field

```tsx add=", getValueList" add={8-10}
import { repo, getValueList } from 'remult'
return (
  <div>
    <div>
      {fields.map((field) => (
        <div key={field.key}>
          {field.label}: <strong>{field.displayValue(task)}</strong>{' '}
          {getValueList(field as any)
            ? `(options: ${getValueList(field as any)})`
            : ''}
        </div>
      ))}
    </div>
  </div>
)
```

You can use these capabilities, together with the structured error model to create dynamic forms, dynamic grid and other dynamic uis that leverage
