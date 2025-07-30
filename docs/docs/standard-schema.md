# Standard Schema

Remult now supports the [Standard Schema](https://standardschema.dev/) specification, allowing you to use your Remult entities as type-safe validators that are compatible with any Standard Schema library.

## Overview

The Standard Schema specification provides a common interface for TypeScript validation libraries. By implementing this standard, Remult entities can be used as validators in any ecosystem that supports Standard Schema, making it easier to integrate with third-party tools and libraries.

Beside the `remult` ORM part, you don't need to add zod, valibot, ArkType, Effect,... to your project, you can use Remult entities as validators with any library that supports the Standard Schema specification.

## Basic Usage

Import the `std` function from Remult and use it to create a Standard Schema compatible validator from any entity:

```ts
import { std, Entity, Fields } from 'remult'

@Entity('User')
class User {
  @Fields.id()
  id!: string

  @Fields.string({ required: true })
  name!: string

  @Fields.number()
  age?: number
}

// Create a Standard Schema validator for the entire entity
const userSchema = std(User)

// Validate data with any Standard Schema library
const result = await validateWithAnyLibrary(userSchema, {
  name: 'John Doe',
  age: 30,
})

if (result.issues) {
  console.log('Validation errors:', result.issues)
} else {
  console.log('Valid data:', result.value)
}
```

## Field-Specific Validation

You can create validators that only check specific fields by passing field names as additional arguments:

```ts
// Validate only the age field
const ageSchema = std(User, 'age')

const result = await validateWithAnyLibrary(ageSchema, { age: 30 })
// Returns: { value: { age: 30 } }

// Validate multiple specific fields
const nameAndAgeSchema = std(User, 'name', 'age')

const result = await validateWithAnyLibrary(nameAndAgeSchema, {
  name: 'John Doe',
  age: 30,
  id: 'ignored', // This will be filtered out
})
// Returns: { value: { name: 'John Doe', age: 30 } }
```

## Validation with Custom Rules

The Standard Schema validator respects all your entity's validation rules, including custom validators and entity-level validation:

```ts
import { Validators } from 'remult'

@Entity('UserMail')
class UserMail {
  @Fields.string({ validate: [Validators.email] })
  email!: string

  @Fields.string()
  job = ''
}

// Email validation will be enforced
const emailSchema = std(UserMail, 'email')

const result = await validateWithAnyLibrary(emailSchema, {
  email: 'invalid-email',
})
// Returns: { issues: [{ message: 'Invalid Email', path: ['email'] }] }

const validResult = await validateWithAnyLibrary(emailSchema, {
  email: 'user@example.com',
})
// Returns: { value: { email: 'user@example.com' } }
```

## Entity-Level Validation

Entity-level validation is also supported:

```ts
@Entity('Task', {
  validation(item) {
    if (item.userId && !item.userId.startsWith('user:')) {
      throw new Error(
        `Task ${item.title} must be assigned with someone starting with [user:]`,
      )
    }
  },
})
class Task {
  @Fields.string()
  title = ''

  @Fields.string({ required: true })
  userId = ''
}

const taskSchema = std(Task)

const result = await validateWithAnyLibrary(taskSchema, {
  title: 'My Task',
  userId: '123', // Invalid format
})
// Returns: { issues: [{ message: 'Task My Task must be assigned with someone starting with [user:]', path: [] }] }
```

## Benefits

- **Interoperability**: Use Remult entities with any Standard Schema compatible library
- **Type Safety**: Full TypeScript support with inferred types
- **Consistency**: Same validation rules across your entire application
- **Flexibility**: Validate entire entities or specific fields
- **Standards Compliance**: Follows the official Standard Schema specification

The Standard Schema integration makes Remult entities more versatile and easier to integrate with the broader TypeScript ecosystem while maintaining all the benefits of Remult's validation system.
