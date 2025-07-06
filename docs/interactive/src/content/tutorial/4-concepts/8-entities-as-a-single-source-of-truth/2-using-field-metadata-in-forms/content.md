---
type: lesson
title: Forms and Validation
focus: /frontend/TodoItem.tsx
template: metadata
---

### Forms and Validation

This lesson will guide you through creating a form with **field-level error handling** and **dynamic field labels** using metadata. You’ll learn how to capture validation errors, display custom field labels, and dynamically reflect error messages for specific fields.

### Code Example: TodoItem Component

Here’s the initial code for the `TodoItem` component:

```file:/frontend/TodoItem.tsx title="frontend/TodoItem.tsx" add={8,11-16,36} collapse={18-29,38-100}

```

### Code Explanation

1. **ErrorInfo Type**:

   - `ErrorInfo<Task>` captures errors specific to each field in the `Task` entity. If validation errors occur, they populate `modelState`, which contains error messages for each field.
   - **Example Validation Error Payload**:
     ```json
     {
       "modelState": {
         "title": "Should not be empty",
         "priority": "Value must be one of: low, medium, high"
       },
       "message": "The Task Title: Should not be empty"
     }
     ```
   - Each error message in `modelState` corresponds to a specific field, allowing targeted error display beside the relevant form inputs.
   - The validations themselves are defined within the entity as part of our single source of truth, ensuring consistent rules and messages across the entire application.
   - Check out the [validation options in the validation article](https://remult.dev/docs/validation) to see how you can define and extend these validations directly in your entity.

2. **The `save` Function**:

   - `save` is triggered when the "Save" button is clicked:
     - It starts by clearing previous errors with `setError(undefined)`.
     - Then, it tries to save the `state` using `taskRepo.save(state)`.
     - If an error occurs, `setError(error)` captures it, with field-specific messages provided by `ErrorInfo<Task>`.

3. **Displaying Field-Level Errors**:
   - Error messages are shown directly below each field using `error?.modelState?.title` and `error?.modelState?.priority`.
   - Optional chaining (`?.`) ensures the UI is protected from undefined values, making error handling efficient and safe.

### Try it Out

Clear the `title` field or set an invalid value for `priority` (anything other than "low," "medium," or "high") and see how validation messages appear in real-time, guiding users to correct their inputs.

### Expanding with Field Options

To enhance the user experience, let’s switch the `priority` input to a dropdown using the priority options defined in the entity.

1. First, add options to `priority`:

   ```tsx title="frontend/TodoItem.tsx" add={3}
   import { getValueList } from 'remult'
   //...
   const options = getValueList(priorityField)
   ```

2. Use the `options` list to render a dropdown:
   ```tsx title="frontend/TodoItem.tsx" add={3-12}
   <label>
     {priorityField.label}:
     <select
       value={state.priority}
       onChange={(e) => setState({ ...state, priority: e.target.value as any })}
     >
       {options.map((option) => (
         <option key={option} value={option}>
           {option}
         </option>
       ))}
     </select>
     <div style={{ color: 'red' }}>{error?.modelState?.priority}</div>
   </label>
   ```

This approach allows you to keep the `priority` options in the entity as a single source of truth, ensuring consistency across the application.

### Dynamic and Scalable Forms

To create a more dynamic form, you can loop through fields directly from the entity, easily building long or short forms without hardcoding field values:

```tsx
import { repo, ErrorInfo, getValueList } from 'remult'
import { Task } from '../shared/Task.js'
import { useState } from 'react'

const taskRepo = repo(Task)
export function TodoItem({ task }: { task: Task }) {
  const [state, setState] = useState(task)
  const [error, setError] = useState<ErrorInfo<Task>>()
  async function save() {
    try {
      setError(undefined)
      await taskRepo.save(state)
    } catch (error: any) {
      setError(error)
    }
  }
  function reset() {
    setError(undefined)
    setState(task)
  }
  const fields = [taskRepo.fields.title, taskRepo.fields.priority]
  return (
    <div>
      {fields.map((field) => {
        const options = getValueList(field)
        return (
          <label key={field.key}>
            {field.label}:
            {options ? (
              <select
                value={state[field.key] as any}
                onChange={(e) =>
                  setState({ ...state, [field.key]: e.target.value })
                }
              >
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={state[field.key] as any}
                onChange={(e) =>
                  setState({ ...state, [field.key]: e.target.value })
                }
              />
            )}
            <div style={{ color: 'red' }}>{error?.modelState?.[field.key]}</div>
          </label>
        )
      })}
      <button onClick={save}>Save</button>
      <button onClick={reset}>Reset</button>
    </div>
  )
}
```

### Try the Interactive Example

Click the `solve` button at the top right of the code editor to see this in action! This setup ensures consistent validation and display across forms and fields, making your UI scalable and reliable.

### Summary

By utilizing field metadata, error handling, and dynamic rendering techniques, you can create reusable, rich forms and UI elements that enhance the consistency and maintainability of your application. These techniques allow you to:

- **Centralize Display Logic**: Labels, input types, and validation can all be maintained within the entity definitions, providing a single source of truth that is easily accessible across the application.
- **Efficiently Handle Validation**: By capturing and displaying field-level errors dynamically, you can offer immediate, user-friendly feedback, ensuring a smoother user experience.
- **Build Scalable, Dynamic Forms**: With access to field metadata and validation options, you can dynamically generate forms that adapt to each field’s specific requirements, reducing code duplication and making it easy to create various form layouts.

Together, these strategies make it straightforward to construct forms and other UI components that are consistently styled, validated, and ready for reuse throughout the application.
