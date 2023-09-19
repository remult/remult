import { describe, it, expect } from 'vitest'
import { Entity, Fields } from '../../core'

@Entity('categories')
class Category {
  @Fields.integer()
  id = 0
  @Fields.string()
  name = ''
  @Fields.toMany(Category, () => Task, 'category')
  tasks: Task[]
  @Fields.toMany(Category, () => Task, 'secondaryCategoryId')
  taskSecondary: Task[]
  @Fields.toMany(Category, () => Task, {
    match: 'secondaryCategoryId',
    limit: 2,
  })
  taskSecondary1: Task[]
  @Fields.toMany(Category, () => Task, {
    match: [['id', 'secondaryCategoryId']],
    limit: 2,
    where: {
      completed: true,
    },
    orderBy: {
      id: 'desc',
    },
  })
  taskSecondary2: Task[]
  @Fields.toMany(Category, () => Task, {
    findOptions: (category) => ({
      limit: 2,
      where: {
        $or: [
          {
            category: { $id: category.id },
          },
          {
            secondaryCategoryId: category.id,
          },
        ],
      },
    }),
  })
  allTasks: Task[]
  @Fields.toOne(Category, () => Task, {
    findOptions: (category) => ({
      where: {
        $or: [
          {
            category: { $id: category.id },
          },
          {
            secondaryCategoryId: category.id,
          },
        ],
      },
    }),
  })
  firstTask: Task
  @Fields.createdAt()
  createdAt = new Date()
}

@Entity('tasks')
class Task {
  @Fields.integer()
  id = 0
  @Fields.string()
  title = ''
  @Fields.toOne(Task, () => Category)
  category!: Category
  @Fields.boolean()
  completed = false

  @Fields.integer()
  secondaryCategoryId = 0
  @Fields.toOne(Task, () => Category, 'secondaryCategoryId')
  secondaryCategory!: Category
  @Fields.toOne(Task, () => Category, {
    match: 'secondaryCategoryId',
  })
  secondaryCategory1!: Category
  @Fields.toOne(Task, () => Category, {
    match: ['secondaryCategoryId', 'id'],
  })
  secondaryCategory2!: Category
}

describe('test relations', () => {})

type onlyObjectMembersBase<entityType> = {
  [K in keyof entityType]: entityType[K] extends object
    ? entityType[K] extends Date
      ? never
      : entityType[K]
    : never
}
type onlyObjectMembers<entityType> = {
  [K in keyof onlyObjectMembersBase<entityType> as K extends keyof onlyObjectMembersBase<entityType>
    ? K
    : never]: true
}

let x: onlyObjectMembers<Category>
