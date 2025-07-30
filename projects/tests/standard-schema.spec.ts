import { describe, expect, it } from 'vitest'
import { std } from '../core/src/standard-schema/index.js'
import { Entity, Field, Fields, repo, Validators } from '../core/index.js'

@Entity('User')
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
    const schema = std(User)
    const ok = { name: 'John Doe', age: 30 }

    const result = await schema['~standard'].validate(ok)
    expect(result).toEqual({ value: ok })
  })

  it('should reject invalid entity data', async () => {
    const schema = std(User)
    const nok = { name: '', age: 30 }

    const result = await schema['~standard'].validate(nok)
    expect(result).toEqual({
      issues: [{ message: 'Should not be empty', path: ['name'] }],
    })
  })

  it('should handle missing required fields', async () => {
    const schema = std(User)
    const nok = {}

    const result = await schema['~standard'].validate(nok)
    expect(result).toEqual({
      issues: [{ message: 'Should not be empty', path: ['name'] }],
    })
  })

  it('only checking age', async () => {
    const schema = std(User, 'age')
    const ok_age = { age: 30 }

    const result = await schema['~standard'].validate(ok_age)
    expect(result).toEqual({ value: ok_age })
  })

  it('age - wrong type', async () => {
    const schema = std(User, 'age')
    const nok_age = { age: 'aAa' }

    const result = await schema['~standard'].validate(nok_age)
    expect(result).toEqual({
      issues: [{ message: 'Invalid value', path: ['age'] }],
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
      const schema = std(UserMail, 'email')
      const nok_mail = { email: 'aAa' }

      const result = await schema['~standard'].validate(nok_mail)
      expect(result).toEqual({
        issues: [{ message: 'Invalid Email', path: ['email'] }],
      })
    })

    it('ok', async () => {
      const schema = std(UserMail, 'email')
      const nok_mail = { email: 'j@tt.fr' }

      const result = await schema['~standard'].validate(nok_mail)

      if (result.issues) {
        // manage the issue
        expect('to never').toBe('here')
      } else {
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

    const schema = std(UserMail, 'email')
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
      const schema = std(ETask)
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
      const schema = std(ETask)
      const ok = { title: 'aAa', userId: 'user:123' }

      const result = await schema['~standard'].validate(ok)
      expect(result).toEqual({ value: ok })
    })

    it('should check only userId (even if entity validation is NOT OK)', async () => {
      const schema = std(ETask, 'userId')
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
