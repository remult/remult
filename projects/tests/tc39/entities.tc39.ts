// Entity + field definitions written with **tc39 standard decorators**.
// This file is compiled separately (see tsconfig.tc39.json) with
// `experimentalDecorators: false` so that tsc lowers the decorators to the
// standard `__esDecorate` runtime form. The compiled .js is then imported by
// entities-tc39.spec.ts and exercised against the legacy-compiled remult core
// to prove the same runtime supports both decorator flavors.
import { Entity, Fields, Relations } from '../../core'

@Entity('tc39_categories', { allowApiCrud: true })
export class Category {
  @Fields.integer()
  id = 0
  @Fields.string()
  name = ''
}

class BaseEntity {
  @Fields.string()
  createdBy = 'system'
}

@Entity<Task>('tc39_tasks', {
  allowApiCrud: true,
})
export class Task extends BaseEntity {
  @Fields.integer()
  id = 0
  @Fields.string({ maxLength: 50 })
  title = ''
  @Fields.boolean()
  completed = false
  @Fields.number()
  priority = 1
  @Fields.integer()
  categoryId = 0
  @Relations.toOne<Task, Category>(() => Category, 'categoryId')
  category?: Category
}
