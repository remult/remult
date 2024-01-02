import { it, expect } from 'vitest'
import { Entity, Fields, Validators, remult } from '../../core'
it('test required validator', async () => {
  @Entity('x', {})
  class x {
    @Fields.number()
    id = 0
    @Fields.string({ validate: Validators.required })
    title = ''
  }
  expect(async () => await remult.repo(x).insert({ id: 1 })).rejects
    .toThrowErrorMatchingInlineSnapshot(`
    {
      "message": "Title: Should not be empty",
      "modelState": {
        "title": "Should not be empty",
      },
    }
  `)
})
it('test basic validation with exception', async () => {
  @Entity('x', {})
  class x {
    @Fields.number()
    id = 0
    @Fields.string({
      validate: () => {
        throw 'err'
      },
    })
    title = ''
  }
  expect(async () => await remult.repo(x).insert({ id: 1 })).rejects
    .toThrowErrorMatchingInlineSnapshot(`
    {
      "message": "Title: err",
      "modelState": {
        "title": "err",
      },
    }
  `)
})
