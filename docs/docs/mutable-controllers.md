# Introduction to Mutable Controllers and Backend Methods

In web development architectures, mutable controllers offer a convenient way to manage state and facilitate interactions between the client (frontend) and the server (backend). These controllers are useful in scenarios where state needs to be maintained and manipulated across server calls, providing a streamlined approach to handling data.

## Overview of Controller Backend Methods

A Controller is a class designed to encapsulate business logic and data processing. When a backend method in a controller is called, it ensures that all field values are preserved and appropriately transferred between the frontend and backend, maintaining state throughout the process.

### Defining a Mutable Controller

The mutable controller is typically defined in a shared module, allowing both the frontend and backend to interact with it efficiently. Below is an example of how to define such a controller and a backend method within it.

### Explanation with Data Flow and Example Usage

This example demonstrates the use of a mutable controller, `UserSignInController`, to handle the sign-in process for users in a web application. Let's break down the key components of this example:

1. **Controller Definition**: The `UserSignInController` is a class annotated with `@Controller('UserSignInController')`, indicating that it serves as a controller for handling user sign-in operations.

2. **Data Flow**: When the `signInUser` backend method is called from the frontend, all the values of the controller fields (`email`, `password`, `rememberMe`) will be sent to the backend for processing. Once the method completes its execution, the updated values (if any) will be sent back to the frontend.

### Example Usage

Here's how you can use the `UserSignInController` on the frontend to initiate the sign-in process:

```typescript
const signInController = new UserSignInController()
signInController.email = 'user@example.com'
signInController.password = 'password123'
signInController.rememberMe = true // Optional: Set to true if the user wants to remain logged in

try {
  const user = await signInController.signInUser()
  console.log(`User signed in: ${user.email}`)
} catch (error) {
  console.error('Sign-in failed:', error.message)
}
```

In this example, we create an instance of `UserSignInController` and set its `email`, `password`, and `rememberMe` fields with the appropriate values. We then call the `signInUser` method to initiate the sign-in process. If successful, we log a message indicating that the user has signed in. If an error occurs during the sign-in process, we catch the error and log a corresponding error message.

This usage demonstrates how to interact with the mutable controller to handle user sign-in operations seamlessly within a web application.

### Summary

Mutable controllers and backend methods provide a powerful mechanism for managing state and handling user interactions in web applications. By encapsulating business logic and data processing within controllers, developers can ensure consistent behavior and efficient data flow between the frontend and backend. With the ability to preserve and transfer field values during server calls, mutable controllers facilitate a smooth and responsive user experience, enhancing the overall functionality and performance of web applications.
