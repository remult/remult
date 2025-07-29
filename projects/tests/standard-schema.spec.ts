import { describe, expect, it } from 'vitest'
import { v } from '../core/src/standard-schema/index.js'
import { Entity, Field, Fields, repo, Validators } from '../core/index.js'

describe('standard-schema', () => {
  it('should validate valid entity data', async () => {
    @Entity('User')
    class User {
      @Fields.string({ required: true })
      name!: string

      @Fields.number()
      age?: number
    }

    const schema = v(User)
    const validUser = { name: 'John Doe', age: 30 }
    const result = await schema['~standard'].validate(validUser)

    expect(result).toEqual({
      value: validUser,
    })
  })

  it('should reject invalid entity data', async () => {
    @Entity('User')
    class User {
      @Fields.string({ required: true })
      name!: string

      @Fields.number()
      age?: number
    }

    const schema = v(User)
    const invalidUser = { name: '', age: 30 } // Empty name should fail validation
    const result = await schema['~standard'].validate(invalidUser)

    expect(result).toEqual({
      issues: [{ message: 'Should not be empty', path: ['name'] }],
    })
  })

  it('should handle missing required fields', async () => {
    @Entity('User')
    class User {
      @Fields.string({ required: true })
      name!: string
    }

    const schema = v(User)
    const invalidUser = {} // Missing required name field
    const result = await schema['~standard'].validate(invalidUser)

    expect(result).toEqual({
      issues: [{ message: 'Should not be empty', path: ['name'] }],
    })
  })

  it('should validate partial entity data', async () => {
    @Entity('User')
    class User {
      @Fields.string({ required: true })
      name!: string

      @Fields.string()
      email?: string
    }

    const schema = v(User)
    const partialUser = { name: 'Jane Doe' } // Only name, email is optional
    const result = await schema['~standard'].validate(partialUser)

    expect(result).toEqual({
      value: partialUser,
    })
  })

  it('should demonstrate type safety with schema types', async () => {
    @Entity('Product')
    class Product {
      @Fields.string({ required: true })
      name!: string

      @Fields.number()
      price?: number
    }

    const schema = v(Product)

    // TypeScript should provide proper type inference
    type SchemaInput = NonNullable<
      (typeof schema)['~standard']['types']
    >['input']
    type SchemaOutput = NonNullable<
      (typeof schema)['~standard']['types']
    >['output']

    // These types should be Partial<Product>
    const _input: SchemaInput = { name: 'Test Product' }
    const _output: SchemaOutput = { name: 'Test Product', price: 100 }

    // Test that the schema works with the inferred types
    const result = await schema['~standard'].validate(_input)

    if ('value' in result) {
      // result.value should be typed as Partial<Product>
      expect(typeof result.value.name).toBe('string')
    }
  })
})
