import { describe, expect, it } from 'vitest'
import { standardSchema } from '../core/src/standard-schema/index.js'
import { Entity, Field, Fields, repo, Validators } from '../core/index.js'

@Entity('users')
class User {
  @Fields.id()
  id!: string

  @Fields.string({ required: true })
  name!: string

  @Fields.number()
  age?: number
}

describe('standard-schema', () => {
  it('should validate valid entity data', async () => {
    const schema = standardSchema(repo(User))
    const ok = { name: 'John Doe', age: 30 }

    const result = await schema['~standard'].validate(ok)
    expect(result).toEqual({ value: ok })
  })

  it('should reject invalid entity data', async () => {
    const schema = standardSchema(repo(User))
    const nok = { name: '', age: 30 }

    const result = await schema['~standard'].validate(nok)
    expect(result).toEqual({
      issues: [{ message: 'Should not be empty', path: ['name'] }],
    })
  })

  it('should handle missing required fields', async () => {
    const schema = standardSchema(repo(User))
    const nok = {}

    const result = await schema['~standard'].validate(nok)
    expect(result).toEqual({
      issues: [{ message: 'Should not be empty', path: ['name'] }],
    })
  })

  describe('object', () => {
    it('only checking age', async () => {
      const schema = standardSchema(repo(User), 'age')
      const ok_age = { age: 30 }

      const result = await schema['~standard'].validate(ok_age)
      expect(result).toEqual({ value: ok_age })
    })

    it('age and name', async () => {
      const schema = standardSchema(repo(User), 'age', 'name')
      const ok_age = { age: 30, name: 'John Doe' }

      const result = await schema['~standard'].validate(ok_age)
      expect(result).toEqual({ value: ok_age })
    })

    it('age - wrong type', async () => {
      const schema = standardSchema(repo(User), 'age')
      const nok_age = { age: 'aAa' }

      const result = await schema['~standard'].validate(nok_age)
      expect(result).toEqual({
        issues: [{ message: 'Invalid value', path: ['age'] }],
      })
    })
  })

  describe('not object', () => {
    it('only checking age', async () => {
      const schema = standardSchema(repo(User), 'age')
      const ok_age = 30

      const result = await schema['~standard'].validate(ok_age)
      expect(result).toEqual({
        issues: [
          {
            message: 'Invalid shape, expected: { age: ___ }',
            path: [],
          },
        ],
      })
    })

    it('age and name', async () => {
      const schema = standardSchema(repo(User), 'age', 'name')
      const not_ok = '30' // All wrong

      const result = await schema['~standard'].validate(not_ok)
      expect(result).toEqual({
        issues: [
          {
            message: 'Invalid shape, expected: { age: ___, name: ___ }',
            path: [],
          },
        ],
      })
    })

    it('only checking age types of return', async () => {
      const schema = standardSchema(repo(User), 'age')
      const ok_age = 30

      const result = await schema['~standard'].validate(ok_age)
      expect(result).toEqual({
        issues: [
          { message: 'Invalid shape, expected: { age: ___ }', path: [] },
        ],
      })
    })

    it('age - wrong type', async () => {
      const schema = standardSchema(repo(User), 'age')
      const nok_age = 'uUu'

      const result = await schema['~standard'].validate(nok_age)
      expect(result).toEqual({
        issues: [
          { message: 'Invalid shape, expected: { age: ___ }', path: [] },
        ],
      })
    })

    it('full obj...', async () => {
      const schema = standardSchema(repo(User))
      const nok_age = 'uUu'

      const result = await schema['~standard'].validate(nok_age)
      expect(result).toEqual({
        issues: [
          {
            message: 'Invalid shape, expected an object of entity: users',
            path: [],
          },
        ],
      })
    })
  })

  describe('mail', () => {
    @Entity('UserMail')
    class UserMail {
      @Fields.string({ validate: [Validators.email] })
      email!: string
      @Fields.string()
      job = ''
    }
    it('not ok', async () => {
      const schema = standardSchema(repo(UserMail), 'email')
      const nok_mail = { email: 'aAa' }

      const result = await schema['~standard'].validate(nok_mail)
      expect(result).toEqual({
        issues: [{ message: 'Invalid Email', path: ['email'] }],
      })
    })

    it('ok 1 field', async () => {
      const schema = standardSchema(repo(UserMail), 'email')
      const nok_mail = { email: 'j@tt.fr' }

      const result = await schema['~standard'].validate(nok_mail)

      if (result.issues) {
        // manage the issue
        expect('to never').toBe('here')
      } else {
        // This should also pass the typescript type test!
        expect(result.value.email).toEqual('j@tt.fr')
      }
    })

    it('ok 2 fields', async () => {
      const schema = standardSchema(repo(UserMail), 'email', 'job')
      const nok_mail = { email: 'j@tt.fr', job: 'boss' }

      const result = await schema['~standard'].validate(nok_mail)

      if (result.issues) {
        // manage the issue
        expect('to never').toBe('here')
      } else {
        // This should also pass the typescript type test!
        expect(result.value.email).toEqual('j@tt.fr')
      }
    })
  })

  it('field throw', async () => {
    @Entity('UserMail')
    class UserMail {
      @Fields.string({
        validate: (v) => {
          throw new Error('test')
        },
      })
      email!: string
    }

    const schema = standardSchema(repo(UserMail), 'email')
    const nok_mail = { email: 'aAa' }

    const result = await schema['~standard'].validate(nok_mail)
    expect(result).toEqual({
      issues: [{ message: 'test', path: ['email'] }],
    })
  })

  describe('entity validation', () => {
    @Entity<ETask>('EntVal', {
      validation(item, ref) {
        const pattern = 'user:'
        if (item.userId && !item.userId.startsWith(pattern)) {
          throw new Error(
            `Task ${item.title} must be assigned with someone starting with [${pattern}]`,
          )
        }
      },
    })
    class ETask {
      @Fields.string()
      title = ''
      @Fields.string({ required: true })
      userId = ''
    }

    it('error wrong userId format', async () => {
      const schema = standardSchema(repo(ETask))
      const nok = { title: 'aAa', userId: '123' }

      const result = await schema['~standard'].validate(nok)
      expect(result.issues).toEqual([
        {
          message:
            'Task aAa must be assigned with someone starting with [user:]',
          path: [],
        },
      ])
    })

    it('good userId format', async () => {
      const schema = standardSchema(repo(ETask))
      const ok = { title: 'aAa', userId: 'user:123' }

      const result = await schema['~standard'].validate(ok)
      expect(result).toEqual({ value: ok })
    })

    it('should check only userId (even if entity validation is NOT OK)', async () => {
      const schema = standardSchema(repo(ETask), 'userId')
      const nok = { title: 'aAa', userId: '123' }

      const result = await schema['~standard'].validate(nok)
      if (result.issues) {
        expect('to never').toBe('here')
      } else {
        expect(result.value).toMatchInlineSnapshot(`
          {
            "userId": "123",
          }
        `)
      }
    })
  })
})
