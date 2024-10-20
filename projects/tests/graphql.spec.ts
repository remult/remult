import { createSchema, createYoga } from 'graphql-yoga'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  Entity,
  Field,
  FieldType,
  Fields,
  InMemoryDataProvider,
  Relations,
  Remult,
  describeClass,
} from '../core'
import { remultGraphql, translateWhereToRestBody } from '../core/graphql'
import { entity } from './tests/dynamic-classes'

@Entity('categoriesmore', {
  allowApiCrud: true,
})
class CategoryMore {
  @Fields.cuid()
  id!: string

  @Fields.string()
  moreInfo = ''

  @Fields.string({ allowNull: true })
  category_id = ''
  @Relations.toOne(() => Category, { field: 'category_id', allowNull: true })
  category!: Category
}

@FieldType<Category>({ displayValue: (_, v) => v?.name })
@Entity('categories', { allowApiCrud: true })
class Category {
  @Fields.string({
    allowApiUpdate: false,
    saving: async (_, ref, { repository }) => {
      // created a consistent id for testing
      ref.value = (await repository.count()).toString()
    },
  })
  id = ''
  @Fields.string()
  name = ''

  @Relations.toMany(() => Task, { field: 'category2' })
  tasksWithCategory2SetToMe?: Task[]
  @Relations.toMany<Category, Task>(() => Task, { field: 'category3_id' })
  tasksWithCategory3SetToMe?: Task[]

  @Relations.toOne<Category, CategoryMore>(() => CategoryMore, {
    fields: {
      category_id: 'id',
    },
    allowNull: true,
  })
  categorymore?: CategoryMore
}

@Entity('tasks', {
  allowApiCrud: true,
})
class Task {
  @Fields.autoIncrement()
  id = 0

  @Fields.string<Task>({
    caption: 'The Title',
    validate: (task) => {
      if (task.title?.length < 3) throw Error('Too short')
    },
  })
  title = ''

  @Fields.boolean({ caption: 'Is it completed' })
  completed = false

  @Fields.object({
    dbName: 'the_priority',
    inputType: 'select',
  })
  thePriority = Priority.High

  @Field(() => Category, { allowNull: true })
  category?: Category

  @Relations.toOne(() => Category, { allowNull: true })
  category2?: Category

  @Fields.string({ allowNull: true })
  category3_id = ''
  @Relations.toOne(() => Category, { field: 'category3_id', allowNull: true })
  category3!: Category
  @Fields.string({
    serverExpression: () => {
      return ''
    },
  })
  userOnServer = ''
}

export enum Priority {
  Low,
  High,
  Critical,
}

describe('graphql', () => {
  let remult: Remult

  let gql: (gql: string) => Promise<any>

  beforeEach(async () => {
    remult = new Remult(new InMemoryDataProvider())

    const { typeDefs, resolvers } = remultGraphql({
      entities: [Task, Category, CategoryMore],
      getRemultFromRequest: async () => remult,
    })

    const yoga = createYoga({
      schema: createSchema({
        typeDefs,
        resolvers,
      }),
    })

    gql = async (query: string) => {
      return await yoga.getResultForParams({
        request: {} as any,
        params: {
          query,
        },
      })
    }
  })

  it('test nodes', async () => {
    const cat = await remult
      .repo(Category)
      .insert([{ name: 'c1' }, { name: 'c2' }])

    const catMore = await remult
      .repo(CategoryMore)
      .insert([{ moreInfo: 'more info for c1', category_id: cat[0].id }])

    await remult.repo(Task).insert({
      title: 'task a',
      category: cat[0],
      category2: cat[1],
      category3_id: cat[1].id,
    })
    await remult.repo(Task).insert({
      title: 'task b',
      category: cat[1],
      category2: cat[1],
      category3: cat[0],
    })

    const tasks: any = await gql(`
    query{
      tasks{
        items{
          id
          title,
          nodeId,
          category{
            id
            nodeId
            categorymore{
              id
              nodeId
              moreInfo
            }
          }
          category2{
            nodeId
            categorymore{
              id
              nodeId
              moreInfo
            }
          }
          category3_id
          category3{
            nodeId
            categorymore{
              id
              nodeId
              moreInfo
            }
          }
        }
      }
    }`)

    expect(tasks).toMatchInlineSnapshot(`
      {
        "data": {
          "tasks": {
            "items": [
              {
                "category": {
                  "categorymore": {
                    "id": "${catMore[0].id}",
                    "moreInfo": "more info for c1",
                    "nodeId": "CategoryMore:${catMore[0].id}",
                  },
                  "id": "0",
                  "nodeId": "Category:0",
                },
                "category2": {
                  "categorymore": null,
                  "nodeId": "Category:1",
                },
                "category3": {
                  "categorymore": null,
                  "nodeId": "Category:1",
                },
                "category3_id": "1",
                "id": 1,
                "nodeId": "Task:1",
                "title": "task a",
              },
              {
                "category": {
                  "categorymore": null,
                  "id": "1",
                  "nodeId": "Category:1",
                },
                "category2": {
                  "categorymore": null,
                  "nodeId": "Category:1",
                },
                "category3": {
                  "categorymore": {
                    "id": "${catMore[0].id}",
                    "moreInfo": "more info for c1",
                    "nodeId": "CategoryMore:${catMore[0].id}",
                  },
                  "nodeId": "Category:0",
                },
                "category3_id": "0",
                "id": 2,
                "nodeId": "Task:2",
                "title": "task b",
              },
            ],
          },
        },
      }
    `)
    const taskNode = await gql(`
    query{
        node(nodeId: "${tasks.data.tasks.items[0].nodeId}"){
          nodeId,
          ... on Task{
            title
          }
        }
    }
    `)
    expect(taskNode).toMatchInlineSnapshot(`
      {
        "data": {
          "node": {
            "nodeId": "Task:1",
            "title": "task a",
          },
        },
      }
    `)
    expect(taskNode.data.node.title).toBe('task a')
  })

  it('test where translator', async () => {
    const fields = remult.repo(Task).fields
    expect(
      translateWhereToRestBody(fields, {
        where: {
          title: { eq: 'aaa' },
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "where": {
          "title": "aaa",
        },
      }
    `)
  })
  it('test where translator in', async () => {
    const meta = remult.repo(Task).metadata
    const result = translateWhereToRestBody(meta.fields, {
      where: {
        title: {
          in: ['aaa', 'ccc'],
        },
      },
    })
    expect(result).toMatchInlineSnapshot(`
      {
        "where": {
          "title.in": [
            "aaa",
            "ccc",
          ],
        },
      }
    `)
  })

  it('test where', async () => {
    await remult
      .repo(Task)
      .insert(['aaa', 'bbb', 'ccc', 'ddd'].map((x) => ({ title: x }))),
      expect(
        (
          await gql(`
    query{
      tasks(where:{}){
        totalCount
      }
    }`)
        ).data.tasks.totalCount,
      ).toBe(4)
  })
  it('test where eq', async () => {
    await remult
      .repo(Task)
      .insert(['aaa', 'bbb', 'ccc', 'ddd'].map((x) => ({ title: x }))),
      expect(
        (
          await gql(`
    query{
      tasks(where:{
        title:{
          eq:"bbb"
        }
      }){
        totalCount
      }
    }`)
        ).data.tasks.totalCount,
      ).toBe(1)
  })
  it('test where in', async () => {
    await remult
      .repo(Task)
      .insert(['aaa', 'bbb', 'ccc', 'ddd'].map((x) => ({ title: x }))),
      expect(
        (
          await gql(`
    query{
      tasks(where:{
        title:{
          in:["bbb","ddd"]
        }
      }){
        totalCount
      }
    }`)
        ).data.tasks.totalCount,
      ).toBe(2)
  })
  it('test where or', async () => {
    await remult
      .repo(Task)
      .insert(['aaa', 'bbb', 'ccc', 'ddd'].map((x) => ({ title: x }))),
      expect(
        (
          await gql(`
    query{
      tasks(where:{
        OR: [{ title: { eq: "aaa" } }, { title: { eq: "bbb" } }],
      }){
        totalCount
      }
    }`)
        ).data.tasks.totalCount,
      ).toBe(2)
  })

  it('test where not in', async () => {
    await remult
      .repo(Task)
      .insert(['aaa', 'bbb', 'ccc', 'ddd'].map((x) => ({ title: x }))),
      expect(
        (
          await gql(`
    query{
      tasks(where:{
        title:{
          nin:["bbb"]
        }
      }){
        totalCount
      }
    }`)
        ).data.tasks.totalCount,
      ).toBe(3)
  })
  it('test contains', async () => {
    await remult
      .repo(Task)
      .insert(['aaa', 'bbb', 'cbc', 'ddd'].map((x) => ({ title: x }))),
      expect(
        (
          await gql(`
    query{
      tasks(where:{
        title:{
          contains:"b"
        }
      }){
        totalCount
      }
    }`)
        ).data.tasks.totalCount,
      ).toBe(2)
  })
  it('test not contains', async () => {
    await remult
      .repo(Task)
      .insert(['aaa', 'bbb', 'cbc', 'ddd'].map((x) => ({ title: x }))),
      expect(
        (
          await gql(`
    query{
      tasks(where:{
        title:{
          notContains:"d"
        }
      }){
        totalCount
      }
    }`)
        ).data.tasks.totalCount,
      ).toBe(3)
  })

  it('gets related entities', async () => {
    const cat = await remult
      .repo(Category)
      .insert([{ name: 'c1' }, { name: 'c2' }])
    await remult.repo(Task).insert({
      title: 'task a',
      category: cat[0],
      category2: cat[1],
      category3_id: cat[1].id,
    })
    await remult.repo(Task).insert({
      title: 'task b',
      category: cat[1],
      category2: cat[1],
      category3: cat[0],
    })

    const result = await gql(`
    query{
      tasks {
        items {
          title
          nodeId
          category {
            name
            nodeId
            tasksOfcategory {
              items {
                title
                nodeId
                category {
                  nodeId
                  name
                }
              }
            }
            tasksWithCategory2SetToMe{
              items{
                nodeId
                title
              }
            }
            tasksWithCategory3SetToMe{
              items{
                nodeId
                title
              }
            }
          }
        }
      }
    }`)
    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "tasks": {
            "items": [
              {
                "category": {
                  "name": "c1",
                  "nodeId": "Category:0",
                  "tasksOfcategory": {
                    "items": [
                      {
                        "category": {
                          "name": "c1",
                          "nodeId": "Category:0",
                        },
                        "nodeId": "Task:1",
                        "title": "task a",
                      },
                    ],
                  },
                  "tasksWithCategory2SetToMe": {
                    "items": [],
                  },
                  "tasksWithCategory3SetToMe": {
                    "items": [
                      {
                        "nodeId": "Task:2",
                        "title": "task b",
                      },
                    ],
                  },
                },
                "nodeId": "Task:1",
                "title": "task a",
              },
              {
                "category": {
                  "name": "c2",
                  "nodeId": "Category:1",
                  "tasksOfcategory": {
                    "items": [
                      {
                        "category": {
                          "name": "c2",
                          "nodeId": "Category:1",
                        },
                        "nodeId": "Task:2",
                        "title": "task b",
                      },
                    ],
                  },
                  "tasksWithCategory2SetToMe": {
                    "items": [
                      {
                        "nodeId": "Task:1",
                        "title": "task a",
                      },
                      {
                        "nodeId": "Task:2",
                        "title": "task b",
                      },
                    ],
                  },
                  "tasksWithCategory3SetToMe": {
                    "items": [
                      {
                        "nodeId": "Task:1",
                        "title": "task a",
                      },
                    ],
                  },
                },
                "nodeId": "Task:2",
                "title": "task b",
              },
            ],
          },
        },
      }
    `)
    expect(result.data.tasks.items[0].category.name).toBe('c1')
    expect(
      result.data.tasks.items[0].category.tasksOfcategory.items[0].title,
    ).toBe('task a')
    expect(result.data.tasks.items[1].category.name).toBe('c2')
    expect(
      result.data.tasks.items[1].category.tasksOfcategory.items[0].title,
    ).toBe('task b')
  })
  it('test get single task by id', async () => {
    const tasks = await remult
      .repo(Task)
      .insert([{ title: 'aaa' }, { title: 'bbb' }, { title: 'ccc' }])

    expect(
      await gql(`
    query{
      task(id: ${tasks[1].id}){
        id,
        title
      }
    }`),
    ).toMatchInlineSnapshot(`
      {
        "data": {
          "task": {
            "id": 2,
            "title": "bbb",
          },
        },
      }
    `)
  })

  it('test count', async () => {
    await remult
      .repo(Task)
      .insert([{ title: 'aaa' }, { title: 'bbb' }, { title: 'ccc' }])

    expect(
      await gql(`
    query{
      tasks{
        totalCount
      }
    }`),
    ).toMatchInlineSnapshot(`
      {
        "data": {
          "tasks": {
            "totalCount": 3,
          },
        },
      }
    `)
  })

  it('test count two', async () => {
    await remult
      .repo(Task)
      .insert([{ title: 'aaa' }, { title: 'bbb' }, { title: 'ccc' }])

    expect(
      await gql(`
    query{
      tasks(
        where:{
          title:{
            lte:"bbb"
          }
        }
      ){
        totalCount
      }
    }`),
    ).toMatchInlineSnapshot(`
      {
        "data": {
          "tasks": {
            "totalCount": 2,
          },
        },
      }
    `)
  })

  it('test limit no page no offset', async () => {
    await remult
      .repo(Task)
      .insert([
        { title: 'aaa' },
        { title: 'bbb' },
        { title: 'ccc' },
        { title: 'ddd' },
        { title: 'eee' },
      ])

    const res = await gql(`query {
  tasks(limit: 2) {
    totalCount
    items {
      title
    }
  }
}`)

    expect(res.data.tasks).toMatchInlineSnapshot(`
      {
        "items": [
          {
            "title": "aaa",
          },
          {
            "title": "bbb",
          },
        ],
        "totalCount": 5,
      }
    `)
  })

  it('test limit page 2, offset 2', async () => {
    await remult
      .repo(Task)
      .insert([
        { title: 'aaa' },
        { title: 'bbb' },
        { title: 'ccc' },
        { title: 'ddd' },
        { title: 'eee' },
      ])

    const res = await gql(`query {
        tasks(limit: 2, page: 2) {
          totalCount
          items {
            title
          }
        }
      }`)

    expect(res.data.tasks).toMatchInlineSnapshot(`
      {
        "items": [
          {
            "title": "ccc",
          },
          {
            "title": "ddd",
          },
        ],
        "totalCount": 5,
      }
    `)

    const resOffset = await gql(`query {
      tasks(limit: 2, offset: 2) {
        totalCount
        items {
          title
        }
      }
    }`)

    expect(resOffset.data.tasks).toMatchObject(res.data.tasks)
  })

  it('test limit page 3, offset 4', async () => {
    await remult
      .repo(Task)
      .insert([
        { title: 'aaa' },
        { title: 'bbb' },
        { title: 'ccc' },
        { title: 'ddd' },
        { title: 'eee' },
      ])

    const res = await gql(`query {
        tasks(limit: 2, page: 3) {
          totalCount
          items {
            title
          }
        }
      }`)

    expect(res.data.tasks).toMatchInlineSnapshot(`
      {
        "items": [
          {
            "title": "eee",
          },
        ],
        "totalCount": 5,
      }
    `)

    const resOffset = await gql(`query {
      tasks(limit: 2, offset: 4) {
        totalCount
        items {
          title
        }
      }
    }`)

    expect(resOffset.data.tasks).toMatchObject(res.data.tasks)
  })

  it('test mutation delete', async () => {
    await await remult
      .repo(Task)
      .insert([{ title: 'task a' }, { title: 'task b' }, { title: 'task c' }])

    expect(
      await gql(`
      mutation delete{
        deleteTask(id:2) {
          id
        }
      }`),
    ).toMatchInlineSnapshot(`
      {
        "data": {
          "deleteTask": {
            "id": 2,
          },
        },
      }
    `)
    expect(await remult.repo(Task).find()).toMatchInlineSnapshot(`
      [
        Task {
          "category": null,
          "category2": null,
          "category3": undefined,
          "category3_id": "",
          "completed": false,
          "id": 1,
          "thePriority": 1,
          "title": "task a",
          "userOnServer": "",
        },
        Task {
          "category": null,
          "category2": null,
          "category3": undefined,
          "category3_id": "",
          "completed": false,
          "id": 3,
          "thePriority": 1,
          "title": "task c",
          "userOnServer": "",
        },
      ]
    `)
  })
  it('test mutation delete many', async () => {
    await await remult
      .repo(Task)
      .insert([{ title: 'task a' }, { title: 'task b' }, { title: 'task c' }])

    expect(
      await gql(`
      mutation delete{
        deleteManyTasks(where:{
          title:{
            lte:"task b"
          }
        }) {
          deleted
        }
      }`),
    ).toMatchInlineSnapshot(`
      {
        "data": {
          "deleteManyTasks": {
            "deleted": 2,
          },
        },
      }
    `)
    expect(await remult.repo(Task).find()).toMatchInlineSnapshot(`
      [
        Task {
          "category": null,
          "category2": null,
          "category3": undefined,
          "category3_id": "",
          "completed": false,
          "id": 3,
          "thePriority": 1,
          "title": "task c",
          "userOnServer": "",
        },
      ]
    `)
  })

  it('test mutation create', async () => {
    const result = await gql(`
    mutation {
      createTask(input: {title: "testing"}) {
        task {
          id
          title
        }
      }
    }`)
    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "createTask": {
            "task": {
              "id": 1,
              "title": "testing",
            },
          },
        },
      }
    `)
    expect(await remult.repo(Task).find()).toMatchInlineSnapshot(`
      [
        Task {
          "category": null,
          "category2": null,
          "category3": undefined,
          "category3_id": "",
          "completed": false,
          "id": 1,
          "thePriority": 1,
          "title": "testing",
          "userOnServer": "",
        },
      ]
    `)
  })

  it('test mutation create clientMutationId', async () => {
    const result = await gql(`
    mutation {
      createTask(input: {title: "testing"}, clientMutationId: "123yop123") {
        ... on CreateTaskPayload {
          clientMutationId
        }
      }
    }`)
    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "createTask": {
            "clientMutationId": "123yop123",
          },
        },
      }
    `)
    expect(await remult.repo(Task).find()).toMatchInlineSnapshot(`
      [
        Task {
          "category": null,
          "category2": null,
          "category3": undefined,
          "category3_id": "",
          "completed": false,
          "id": 1,
          "thePriority": 1,
          "title": "testing",
          "userOnServer": "",
        },
      ]
    `)
  })

  it('test mutation update Many', async () => {
    await remult
      .repo(Task)
      .insert([{ title: 'task a' }, { title: 'task b' }, { title: 'task c' }])

    const result = await gql(`
    mutation {
      updateManyTasks(where:{
        title:{
          lte:"task b"
        }
      }, patch: {title: "bbb"}) {
        updated
      }
    }`)
    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "updateManyTasks": {
            "updated": 2,
          },
        },
      }
    `)
    expect(await remult.repo(Task).count({ title: 'bbb' })).toBe(2)
  })
  it('test mutation update', async () => {
    await remult.repo(Task).insert({ title: 'aaa' })

    const result = await gql(`
    mutation {
      updateTask(id:1, patch: {title: "bbb"}) {
        task {
          id
          title
        }
      }
    }`)
    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "updateTask": {
            "task": {
              "id": 1,
              "title": "bbb",
            },
          },
        },
      }
    `)
  })

  it('test mutation generic error', async () => {
    const result = await gql(`
    mutation {
      createTask(input: {title: "a"}, clientMutationId: "yop") {
        task {
          id
        }
        error {
          ... on Error {
            message
          }
        }
        clientMutationId
      }
    }`)
    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "createTask": {
            "clientMutationId": "yop",
            "error": {
              "message": "The Title: Too short",
            },
            "task": null,
          },
        },
      }
    `)
  })

  it('test mutation validation error', async () => {
    const result = await gql(`
    mutation {
      createTask(input: {title: "a"}) {
        task {
          id
        }
        error {
          ... on ValidationError {
            message
            modelState {
              field
              message
            }
          }
        }
      }
    }`)
    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "createTask": {
            "error": {
              "message": "The Title: Too short",
              "modelState": [
                {
                  "field": "title",
                  "message": "Too short",
                },
              ],
            },
            "task": null,
          },
        },
      }
    `)
  })
  it('test mutation update validation error', async () => {
    let task = await remult.repo(Task).insert({ title: 'task c' })
    const result = await gql(`
    mutation {
      updateTask(id: ${task.id},patch: {title: "a"}) {
        task {
          id
        }
        error {
          ... on ValidationError {
            message
            modelState {
              field
              message
            }
          }
        }
      }
    }`)
    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "updateTask": {
            "error": {
              "message": "The Title: Too short",
              "modelState": [
                {
                  "field": "title",
                  "message": "Too short",
                },
              ],
            },
            "task": null,
          },
        },
      }
    `)
  })

  it('test graphql', async () => {
    await remult.repo(Task).insert([{ title: 'task c' }])
    await remult.repo(Task).insert([{ title: 'task b' }])
    await remult.repo(Task).insert([{ title: 'task a' }])
    expect(await remult.repo(Task).count()).toBe(3)

    const result = await gql(`
    query Tasks {
      tasks(orderBy: { title: ASC }) {
        items {
          id
          title
          completed
        }
      }
    }`)

    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "tasks": {
            "items": [
              {
                "completed": false,
                "id": 3,
                "title": "task a",
              },
              {
                "completed": false,
                "id": 2,
                "title": "task b",
              },
              {
                "completed": false,
                "id": 1,
                "title": "task c",
              },
            ],
          },
        },
      }
    `)
  })
  it('test fail with partial entities', async () => {
    // rmv removeComments is very handy for testing!
    expect(() =>
      remultGraphql({
        entities: [Task, Category],
        removeComments: true,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Entity "CategoryMore" that is used by the relation "categorymore" in "Category" was not found in the 'entities' array.]`,
    )
  })

  it('test basics', async () => {
    // rmv removeComments is very handy for testing!
    const { typeDefs } = remultGraphql({
      entities: [Task, Category, CategoryMore],
      removeComments: true,
    })

    expect(typeDefs).toMatchInlineSnapshot(`
      "type Query {
          task(id: ID!): Task
          tasks(limit: Int, page: Int, offset: Int, orderBy: tasksOrderBy, where: tasksWhere): TaskConnection
          category(id: ID!): Category
          categories(limit: Int, page: Int, offset: Int, orderBy: categoriesOrderBy, where: categoriesWhere): CategoryConnection
          categoryMore(id: ID!): CategoryMore
          categoriesmore(limit: Int, page: Int, offset: Int, orderBy: categoriesmoreOrderBy, where: categoriesmoreWhere): CategoryMoreConnection
          node(nodeId: ID!): Node
      }

      type Mutation {
          createTask(input: CreateTaskInput!, clientMutationId: String): CreateTaskPayload
          updateTask(id: ID!, patch: UpdateTaskInput!, clientMutationId: String): UpdateTaskPayload
          updateManyTasks(where: tasksWhere!, patch: UpdateTaskInput!, clientMutationId: String): UpdateManyTasksPayload
          deleteTask(id: ID!, clientMutationId: String): DeleteTaskPayload
          deleteManyTasks(where: tasksWhere!, clientMutationId: String): DeleteManyTasksPayload
          createCategory(input: CreateCategoryInput!, clientMutationId: String): CreateCategoryPayload
          updateCategory(id: ID!, patch: UpdateCategoryInput!, clientMutationId: String): UpdateCategoryPayload
          updateManyCategories(where: categoriesWhere!, patch: UpdateCategoryInput!, clientMutationId: String): UpdateManyCategoriesPayload
          deleteCategory(id: ID!, clientMutationId: String): DeleteCategoryPayload
          deleteManyCategories(where: categoriesWhere!, clientMutationId: String): DeleteManyCategoriesPayload
          createCategoryMore(input: CreateCategoryMoreInput!, clientMutationId: String): CreateCategoryMorePayload
          updateCategoryMore(id: ID!, patch: UpdateCategoryMoreInput!, clientMutationId: String): UpdateCategoryMorePayload
          updateManyCategoriesmore(where: categoriesmoreWhere!, patch: UpdateCategoryMoreInput!, clientMutationId: String): UpdateManyCategoriesmorePayload
          deleteCategoryMore(id: ID!, clientMutationId: String): DeleteCategoryMorePayload
          deleteManyCategoriesmore(where: categoriesmoreWhere!, clientMutationId: String): DeleteManyCategoriesmorePayload
      }

      type Task implements Node {
          id: Int!
          title: String!
          completed: Boolean!
          thePriority: String!
          category: Category
          category2: Category
          category3_id: String
          category3: Category
          userOnServer: String!
          nodeId: ID!
      }

      input tasksOrderBy {
        id: OrderByDirection
        title: OrderByDirection
        completed: OrderByDirection
        thePriority: OrderByDirection
        category: OrderByDirection
        category2: OrderByDirection
        category3_id: OrderByDirection
      }

      input tasksWhere {
        id: WhereInt
        title: WhereString
        completed: WhereBoolean
        thePriority: WhereString
        category3_id: WhereStringNullable
        OR: [tasksWhere!]
      }

      type TaskConnection {
          totalCount: Int!
          items: [Task!]!
      }

      input CreateTaskInput {
          title: String
          completed: Boolean
          thePriority: String
          category: ID
          category2: ID
          category3_id: String
          userOnServer: String
      }

      type CreateTaskPayload {
          task: Task
          error: ErrorDetail
          clientMutationId: String
      }

      input UpdateTaskInput {
          title: String
          completed: Boolean
          thePriority: String
          category: ID
          category2: ID
          category3_id: String
          userOnServer: String
      }

      type UpdateTaskPayload {
          task: Task
          error: ErrorDetail
          clientMutationId: String
      }

      type UpdateManyTasksPayload {
          updated: Int!
          error: ErrorDetail
          clientMutationId: String
      }

      type DeleteTaskPayload {
          id: Int
          error: ErrorDetail
          clientMutationId: String
      }

      type DeleteManyTasksPayload {
          deleted: Int!
          error: ErrorDetail
          clientMutationId: String
      }

      type Category implements Node {
          id: String!
          name: String!
          categorymore: CategoryMore
          tasksOfcategory(limit: Int, page: Int, offset: Int, orderBy: tasksOrderBy, where: tasksWhere): TaskConnection
          tasksWithCategory2SetToMe(limit: Int, page: Int, offset: Int, orderBy: tasksOrderBy, where: tasksWhere): TaskConnection
          tasksWithCategory3SetToMe(limit: Int, page: Int, offset: Int, orderBy: tasksOrderBy, where: tasksWhere): TaskConnection
          nodeId: ID!
      }

      input categoriesOrderBy {
        id: OrderByDirection
        name: OrderByDirection
      }

      input categoriesWhere {
        id: WhereString
        name: WhereString
        OR: [categoriesWhere!]
      }

      type CategoryConnection {
          totalCount: Int!
          items: [Category!]!
      }

      input CreateCategoryInput {
          name: String
      }

      type CreateCategoryPayload {
          category: Category
          error: ErrorDetail
          clientMutationId: String
      }

      input UpdateCategoryInput {
          name: String
      }

      type UpdateCategoryPayload {
          category: Category
          error: ErrorDetail
          clientMutationId: String
      }

      type UpdateManyCategoriesPayload {
          updated: Int!
          error: ErrorDetail
          clientMutationId: String
      }

      type DeleteCategoryPayload {
          id: String
          error: ErrorDetail
          clientMutationId: String
      }

      type DeleteManyCategoriesPayload {
          deleted: Int!
          error: ErrorDetail
          clientMutationId: String
      }

      type CategoryMore implements Node {
          id: String!
          moreInfo: String!
          category_id: String
          category: Category
          nodeId: ID!
      }

      input categoriesmoreOrderBy {
        id: OrderByDirection
        moreInfo: OrderByDirection
        category_id: OrderByDirection
      }

      input categoriesmoreWhere {
        id: WhereString
        moreInfo: WhereString
        category_id: WhereStringNullable
        OR: [categoriesmoreWhere!]
      }

      type CategoryMoreConnection {
          totalCount: Int!
          items: [CategoryMore!]!
      }

      input CreateCategoryMoreInput {
          moreInfo: String
          category_id: String
      }

      type CreateCategoryMorePayload {
          categoryMore: CategoryMore
          error: ErrorDetail
          clientMutationId: String
      }

      input UpdateCategoryMoreInput {
          moreInfo: String
          category_id: String
      }

      type UpdateCategoryMorePayload {
          categoryMore: CategoryMore
          error: ErrorDetail
          clientMutationId: String
      }

      type UpdateManyCategoriesmorePayload {
          updated: Int!
          error: ErrorDetail
          clientMutationId: String
      }

      type DeleteCategoryMorePayload {
          id: String
          error: ErrorDetail
          clientMutationId: String
      }

      type DeleteManyCategoriesmorePayload {
          deleted: Int!
          error: ErrorDetail
          clientMutationId: String
      }

      input WhereString {
          eq: String
          ne: String
          in: [String!]
          nin: [String!]
          gt: String
          gte: String
          lt: String
          lte: String
          contains: String
          notContains: String
      }

      input WhereStringNullable {
          eq: String
          ne: String
          in: [String!]
          nin: [String!]
          gt: String
          gte: String
          lt: String
          lte: String
          contains: String
          notContains: String
          null: Boolean
      }

      input WhereInt {
          eq: Int
          ne: Int
          in: [Int!]
          nin: [Int!]
          gt: Int
          gte: Int
          lt: Int
          lte: Int
      }

      input WhereIntNullable {
          eq: Int
          ne: Int
          in: [Int!]
          nin: [Int!]
          gt: Int
          gte: Int
          lt: Int
          lte: Int
          null: Boolean
      }

      input WhereFloat {
          eq: Float
          ne: Float
          in: [Float!]
          nin: [Float!]
          gt: Float
          gte: Float
          lt: Float
          lte: Float
      }

      input WhereFloatNullable {
          eq: Float
          ne: Float
          in: [Float!]
          nin: [Float!]
          gt: Float
          gte: Float
          lt: Float
          lte: Float
          null: Boolean
      }

      input WhereBoolean {
          eq: Boolean
          ne: Boolean
          in: [Boolean!]
          nin: [Boolean!]
      }

      input WhereBooleanNullable {
          eq: Boolean
          ne: Boolean
          in: [Boolean!]
          nin: [Boolean!]
          null: Boolean
      }

      input WhereID {
          eq: ID
          ne: ID
          in: [ID!]
          nin: [ID!]
      }

      input WhereIDNullable {
          eq: ID
          ne: ID
          in: [ID!]
          nin: [ID!]
          null: Boolean
      }

      enum OrderByDirection {
          ASC
          DESC
      }

      interface Node {
          nodeId: ID!
      }

      union ErrorDetail = ValidationError | ForbiddenError | NotFoundError

      interface Error {
          message: String!
      }

      type ValidationError implements Error {
          message: String!
          modelState: [ValidationErrorModelState!]!
      }

      type ValidationErrorModelState {
          field: String!
          message: String!
      }

      type ForbiddenError implements Error {
          message: String!
      }

      type NotFoundError implements Error {
          message: String!
      }
      "
    `)
  })
  it('test allow api delete', async () => {
    const C = class {
      id = 0
    }
    describeClass(
      C,
      Entity('cs', { allowApiCrud: true, allowApiDelete: false }),
      {
        id: Fields.integer(),
      },
    )
    // rmv removeComments is very handy for testing!
    const { typeDefs } = remultGraphql({
      entities: [C],
      removeComments: true,
    })

    expect(typeDefs).toMatchInlineSnapshot(`
      "type Query {
          c(id: ID!): C
          cs(limit: Int, page: Int, offset: Int, orderBy: csOrderBy, where: csWhere): CConnection
          node(nodeId: ID!): Node
      }

      type Mutation {
          createC(input: CreateCInput!, clientMutationId: String): CreateCPayload
          updateC(id: ID!, patch: UpdateCInput!, clientMutationId: String): UpdateCPayload
          updateManyCs(where: csWhere!, patch: UpdateCInput!, clientMutationId: String): UpdateManyCsPayload
      }

      type C implements Node {
          id: Int!
          nodeId: ID!
      }

      input csOrderBy {
        id: OrderByDirection
      }

      input csWhere {
        id: WhereInt
        OR: [csWhere!]
      }

      type CConnection {
          totalCount: Int!
          items: [C!]!
      }

      input CreateCInput {
          id: Int
      }

      type CreateCPayload {
          c: C
          error: ErrorDetail
          clientMutationId: String
      }

      input UpdateCInput {
          id: Int
      }

      type UpdateCPayload {
          c: C
          error: ErrorDetail
          clientMutationId: String
      }

      type UpdateManyCsPayload {
          updated: Int!
          error: ErrorDetail
          clientMutationId: String
      }

      input WhereString {
          eq: String
          ne: String
          in: [String!]
          nin: [String!]
          gt: String
          gte: String
          lt: String
          lte: String
          contains: String
          notContains: String
      }

      input WhereStringNullable {
          eq: String
          ne: String
          in: [String!]
          nin: [String!]
          gt: String
          gte: String
          lt: String
          lte: String
          contains: String
          notContains: String
          null: Boolean
      }

      input WhereInt {
          eq: Int
          ne: Int
          in: [Int!]
          nin: [Int!]
          gt: Int
          gte: Int
          lt: Int
          lte: Int
      }

      input WhereIntNullable {
          eq: Int
          ne: Int
          in: [Int!]
          nin: [Int!]
          gt: Int
          gte: Int
          lt: Int
          lte: Int
          null: Boolean
      }

      input WhereFloat {
          eq: Float
          ne: Float
          in: [Float!]
          nin: [Float!]
          gt: Float
          gte: Float
          lt: Float
          lte: Float
      }

      input WhereFloatNullable {
          eq: Float
          ne: Float
          in: [Float!]
          nin: [Float!]
          gt: Float
          gte: Float
          lt: Float
          lte: Float
          null: Boolean
      }

      input WhereBoolean {
          eq: Boolean
          ne: Boolean
          in: [Boolean!]
          nin: [Boolean!]
      }

      input WhereBooleanNullable {
          eq: Boolean
          ne: Boolean
          in: [Boolean!]
          nin: [Boolean!]
          null: Boolean
      }

      input WhereID {
          eq: ID
          ne: ID
          in: [ID!]
          nin: [ID!]
      }

      input WhereIDNullable {
          eq: ID
          ne: ID
          in: [ID!]
          nin: [ID!]
          null: Boolean
      }

      enum OrderByDirection {
          ASC
          DESC
      }

      interface Node {
          nodeId: ID!
      }

      union ErrorDetail = ValidationError | ForbiddenError | NotFoundError

      interface Error {
          message: String!
      }

      type ValidationError implements Error {
          message: String!
          modelState: [ValidationErrorModelState!]!
      }

      type ValidationErrorModelState {
          field: String!
          message: String!
      }

      type ForbiddenError implements Error {
          message: String!
      }

      type NotFoundError implements Error {
          message: String!
      }
      "
    `)
  })
  it('test naming issue', async () => {
    const C = entity('ContactTag', {
      id: Fields.number(),
    })

    const { typeDefs } = remultGraphql({
      entities: [C],
      removeComments: true,
    })

    expect(typeDefs).toMatchInlineSnapshot(`
      "type Query {
          singleContactTag(id: ID!): ContactTag
          ContactTag(limit: Int, page: Int, offset: Int, orderBy: ContactTagOrderBy, where: ContactTagWhere): ContactTagConnection
          node(nodeId: ID!): Node
      }



      type ContactTag implements Node {
          id: Float!
          nodeId: ID!
      }

      input ContactTagOrderBy {
        id: OrderByDirection
      }

      input ContactTagWhere {
        id: WhereFloat
        OR: [ContactTagWhere!]
      }

      type ContactTagConnection {
          totalCount: Int!
          items: [ContactTag!]!
      }

      input WhereString {
          eq: String
          ne: String
          in: [String!]
          nin: [String!]
          gt: String
          gte: String
          lt: String
          lte: String
          contains: String
          notContains: String
      }

      input WhereStringNullable {
          eq: String
          ne: String
          in: [String!]
          nin: [String!]
          gt: String
          gte: String
          lt: String
          lte: String
          contains: String
          notContains: String
          null: Boolean
      }

      input WhereInt {
          eq: Int
          ne: Int
          in: [Int!]
          nin: [Int!]
          gt: Int
          gte: Int
          lt: Int
          lte: Int
      }

      input WhereIntNullable {
          eq: Int
          ne: Int
          in: [Int!]
          nin: [Int!]
          gt: Int
          gte: Int
          lt: Int
          lte: Int
          null: Boolean
      }

      input WhereFloat {
          eq: Float
          ne: Float
          in: [Float!]
          nin: [Float!]
          gt: Float
          gte: Float
          lt: Float
          lte: Float
      }

      input WhereFloatNullable {
          eq: Float
          ne: Float
          in: [Float!]
          nin: [Float!]
          gt: Float
          gte: Float
          lt: Float
          lte: Float
          null: Boolean
      }

      input WhereBoolean {
          eq: Boolean
          ne: Boolean
          in: [Boolean!]
          nin: [Boolean!]
      }

      input WhereBooleanNullable {
          eq: Boolean
          ne: Boolean
          in: [Boolean!]
          nin: [Boolean!]
          null: Boolean
      }

      input WhereID {
          eq: ID
          ne: ID
          in: [ID!]
          nin: [ID!]
      }

      input WhereIDNullable {
          eq: ID
          ne: ID
          in: [ID!]
          nin: [ID!]
          null: Boolean
      }

      enum OrderByDirection {
          ASC
          DESC
      }

      interface Node {
          nodeId: ID!
      }

      union ErrorDetail = ValidationError | ForbiddenError | NotFoundError

      interface Error {
          message: String!
      }

      type ValidationError implements Error {
          message: String!
          modelState: [ValidationErrorModelState!]!
      }

      type ValidationErrorModelState {
          field: String!
          message: String!
      }

      type ForbiddenError implements Error {
          message: String!
      }

      type NotFoundError implements Error {
          message: String!
      }
      "
    `)
  })

  it('test allow api create', async () => {
    const C = class {
      id = 0
    }
    describeClass(
      C,
      Entity('cs', { allowApiCrud: true, allowApiInsert: false }),
      {
        id: Fields.integer(),
      },
    )
    // rmv removeComments is very handy for testing!
    const { typeDefs } = remultGraphql({
      entities: [C],
      removeComments: true,
    })

    expect(typeDefs).toMatchInlineSnapshot(
      `
      "type Query {
          c(id: ID!): C
          cs(limit: Int, page: Int, offset: Int, orderBy: csOrderBy, where: csWhere): CConnection
          node(nodeId: ID!): Node
      }

      type Mutation {
          updateC(id: ID!, patch: UpdateCInput!, clientMutationId: String): UpdateCPayload
          updateManyCs(where: csWhere!, patch: UpdateCInput!, clientMutationId: String): UpdateManyCsPayload
          deleteC(id: ID!, clientMutationId: String): DeleteCPayload
          deleteManyCs(where: csWhere!, clientMutationId: String): DeleteManyCsPayload
      }

      type C implements Node {
          id: Int!
          nodeId: ID!
      }

      input csOrderBy {
        id: OrderByDirection
      }

      input csWhere {
        id: WhereInt
        OR: [csWhere!]
      }

      type CConnection {
          totalCount: Int!
          items: [C!]!
      }

      input UpdateCInput {
          id: Int
      }

      type UpdateCPayload {
          c: C
          error: ErrorDetail
          clientMutationId: String
      }

      type UpdateManyCsPayload {
          updated: Int!
          error: ErrorDetail
          clientMutationId: String
      }

      type DeleteCPayload {
          id: Int
          error: ErrorDetail
          clientMutationId: String
      }

      type DeleteManyCsPayload {
          deleted: Int!
          error: ErrorDetail
          clientMutationId: String
      }

      input WhereString {
          eq: String
          ne: String
          in: [String!]
          nin: [String!]
          gt: String
          gte: String
          lt: String
          lte: String
          contains: String
          notContains: String
      }

      input WhereStringNullable {
          eq: String
          ne: String
          in: [String!]
          nin: [String!]
          gt: String
          gte: String
          lt: String
          lte: String
          contains: String
          notContains: String
          null: Boolean
      }

      input WhereInt {
          eq: Int
          ne: Int
          in: [Int!]
          nin: [Int!]
          gt: Int
          gte: Int
          lt: Int
          lte: Int
      }

      input WhereIntNullable {
          eq: Int
          ne: Int
          in: [Int!]
          nin: [Int!]
          gt: Int
          gte: Int
          lt: Int
          lte: Int
          null: Boolean
      }

      input WhereFloat {
          eq: Float
          ne: Float
          in: [Float!]
          nin: [Float!]
          gt: Float
          gte: Float
          lt: Float
          lte: Float
      }

      input WhereFloatNullable {
          eq: Float
          ne: Float
          in: [Float!]
          nin: [Float!]
          gt: Float
          gte: Float
          lt: Float
          lte: Float
          null: Boolean
      }

      input WhereBoolean {
          eq: Boolean
          ne: Boolean
          in: [Boolean!]
          nin: [Boolean!]
      }

      input WhereBooleanNullable {
          eq: Boolean
          ne: Boolean
          in: [Boolean!]
          nin: [Boolean!]
          null: Boolean
      }

      input WhereID {
          eq: ID
          ne: ID
          in: [ID!]
          nin: [ID!]
      }

      input WhereIDNullable {
          eq: ID
          ne: ID
          in: [ID!]
          nin: [ID!]
          null: Boolean
      }

      enum OrderByDirection {
          ASC
          DESC
      }

      interface Node {
          nodeId: ID!
      }

      union ErrorDetail = ValidationError | ForbiddenError | NotFoundError

      interface Error {
          message: String!
      }

      type ValidationError implements Error {
          message: String!
          modelState: [ValidationErrorModelState!]!
      }

      type ValidationErrorModelState {
          field: String!
          message: String!
      }

      type ForbiddenError implements Error {
          message: String!
      }

      type NotFoundError implements Error {
          message: String!
      }
      "
    `,
    )
  })
})
