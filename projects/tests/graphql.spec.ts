import { expect, it, describe, beforeEach } from "vitest"
import { createSchema, createYoga } from "graphql-yoga"
import {
  Entity,
  Field,
  FieldType,
  Fields,
  InMemoryDataProvider,
  Remult,
  describeClass,
  remult
} from "../core"
import { remultGraphql, translateWhereToRestBody } from "../core/graphql"

@FieldType({ displayValue: (_, v) => v?.name })
@Entity("categories", { allowApiCrud: true })
class Category {
  @Fields.string({
    allowApiUpdate: false,
    saving: async (_, ref) => {
      // created a consistent id for testing
      ref.value = (await ref.entityRef.repository.count()).toString()
    }
  })
  id = ""
  @Fields.string()
  name = ""
}

@Entity("tasks", {
  allowApiCrud: true
})
class Task {
  @Fields.autoIncrement()
  id = 0

  @Fields.string({
    caption: "The Title",
    validate: (task) => {
      if (task.title?.length < 3) throw Error("Too short")
    }
  })
  title = ""

  @Fields.boolean({ caption: "Is it completed" })
  completed = false

  @Fields.object({
    dbName: "the_priority",
    inputType: "select"
  })
  thePriority = Priority.High

  @Field(() => Category, { allowNull: true })
  category?: Category

  @Fields.string({
    serverExpression: () => {
      return ""
    }
  })
  userOnServer = ""
}

export enum Priority {
  Low,
  High,
  Critical
}

describe("graphql", () => {
  let remult: Remult

  let gql: (gql: string) => Promise<any>

  beforeEach(async () => {
    remult = new Remult(new InMemoryDataProvider())

    const { typeDefs, resolvers } = remultGraphql({
      entities: [Task, Category],
      getRemultFromRequest: () => remult
    })

    const yoga = createYoga({
      schema: createSchema({
        typeDefs,
        resolvers
      })
    })

    gql = async (query: string) => {
      return await yoga.getResultForParams({
        request: {} as any,
        params: {
          query
        }
      })
    }
  })

  it('test nodes', async () => {

    const cat = await remult.repo(Category).insert([{ name: 'c1' }, { name: 'c2' }])

    await remult.repo(Task).insert({ title: 'task a', category: cat[0] })
    await remult.repo(Task).insert({ title: 'task b', category: cat[1] })

    const tasks: any = await gql(`
    query{
      tasks{
        items{
          title,
          nodeId,
          category{
            nodeId
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
                  "nodeId": "Category:0",
                },
                "nodeId": "Task:1",
                "title": "task a",
              },
              {
                "category": {
                  "nodeId": "Category:1",
                },
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

  it("test where translator", async () => {
    const fields = remult.repo(Task).fields
    expect(
      translateWhereToRestBody(fields, {
        where: {
          title: { eq: "aaa" }
        }
      })
    ).toMatchInlineSnapshot(`
      {
        "title": "aaa",
      }
    `)
  })
  it("test where translator in", async () => {
    const meta = remult.repo(Task).metadata
    const result = translateWhereToRestBody(meta.fields, {
      where: {
        title: {
          in: ["aaa", "ccc"]
        }
      }
    })
    expect(result).toMatchInlineSnapshot(`
      {
        "title.in": [
          "aaa",
          "ccc",
        ],
      }
    `)
  })

  it("test where", async () => {
    await remult
      .repo(Task)
      .insert(["aaa", "bbb", "ccc", "ddd"].map((x) => ({ title: x }))),
      expect(
        (
          await gql(`
    query{
      tasks(where:{}){
        totalCount
      }
    }`)
        ).data.tasks.totalCount
      ).toBe(4)
  })
  it("test where eq", async () => {
    await remult
      .repo(Task)
      .insert(["aaa", "bbb", "ccc", "ddd"].map((x) => ({ title: x }))),
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
        ).data.tasks.totalCount
      ).toBe(1)
  })
  it("test where in", async () => {
    await remult
      .repo(Task)
      .insert(["aaa", "bbb", "ccc", "ddd"].map((x) => ({ title: x }))),
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
        ).data.tasks.totalCount
      ).toBe(2)
  })
  it("test where or", async () => {
    await remult
      .repo(Task)
      .insert(["aaa", "bbb", "ccc", "ddd"].map((x) => ({ title: x }))),
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
        ).data.tasks.totalCount
      ).toBe(2)
  })

  it("test where not in", async () => {
    await remult
      .repo(Task)
      .insert(["aaa", "bbb", "ccc", "ddd"].map((x) => ({ title: x }))),
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
        ).data.tasks.totalCount
      ).toBe(3)
  })

  it("gets related entities", async () => {
    const cat = await remult
      .repo(Category)
      .insert([{ name: "c1" }, { name: "c2" }])
    await remult.repo(Task).insert({ title: "task a", category: cat[0] })
    await remult.repo(Task).insert({ title: "task b", category: cat[1] })

    const result = await gql(`
    query{
      tasks{
        items{
          title
          category{
            name
            tasks{
              items {
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
                  "tasks": {
                    "items": [
                      {
                        "title": "task a",
                      },
                    ],
                  },
                },
                "title": "task a",
              },
              {
                "category": {
                  "name": "c2",
                  "tasks": {
                    "items": [
                      {
                        "title": "task b",
                      },
                    ],
                  },
                },
                "title": "task b",
              },
            ],
          },
        },
      }
    `)
    expect(result.data.tasks.items[0].category.name).toBe("c1")
    expect(result.data.tasks.items[0].category.tasks.items[0].title).toBe(
      "task a"
    )
    expect(result.data.tasks.items[1].category.name).toBe("c2")
    expect(result.data.tasks.items[1].category.tasks.items[0].title).toBe(
      "task b"
    )
  })
  it("test get single task by id", async () => {
    const tasks = await remult
      .repo(Task)
      .insert([{ title: "aaa" }, { title: "bbb" }, { title: "ccc" }])

    expect(
      await gql(`
    query{
      task(id: ${tasks[1].id}){
        id,
        title
      }
    }`)
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

  it("test count", async () => {
    await remult
      .repo(Task)
      .insert([{ title: "aaa" }, { title: "bbb" }, { title: "ccc" }])

    expect(
      await gql(`
    query{
      tasks{
        totalCount
      }
    }`)
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

  it("test count two", async () => {
    await remult
      .repo(Task)
      .insert([{ title: "aaa" }, { title: "bbb" }, { title: "ccc" }])

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
    }`)
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
  it("test mutation delete", async () => {
    await await remult
      .repo(Task)
      .insert([{ title: "task a" }, { title: "task b" }, { title: "task c" }])

    expect(
      await gql(`
      mutation delete{
        deleteTask(id:2) {
          id
        }
      }`)
    ).toMatchInlineSnapshot(`
      {
        "data": {
          "deleteTask": {
            "id": "2",
          },
        },
      }
    `)
    expect(await remult.repo(Task).find()).toMatchInlineSnapshot(`
      [
        Task {
          "category": null,
          "completed": false,
          "id": 1,
          "thePriority": 1,
          "title": "task a",
          "userOnServer": "",
        },
        Task {
          "category": null,
          "completed": false,
          "id": 3,
          "thePriority": 1,
          "title": "task c",
          "userOnServer": "",
        },
      ]
    `)
  })

  it("test mutation create", async () => {
    const result = await gql(`
    mutation {
      createTask(input: {title: "testing"}) {
        task {
          ... on Task {
            id
            title
          }
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
          "completed": false,
          "id": 1,
          "thePriority": 1,
          "title": "testing",
          "userOnServer": "",
        },
      ]
    `)
  })

  it("test mutation create clientMutationId", async () => {
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
          "completed": false,
          "id": 1,
          "thePriority": 1,
          "title": "testing",
          "userOnServer": "",
        },
      ]
    `)
  })

  it("test mutation update", async () => {
    await remult.repo(Task).insert({ title: "aaa" })

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

  it("test mutation generic error", async () => {
    const result = await gql(`
    mutation {
      createTask(input: {title: "a"}, clientMutationId: "yop") {
        task {
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
            "task": {
              "message": "The Title: Too short",
            },
          },
        },
      }
    `)
  })

  it("test mutation validation error", async () => {
    const result = await gql(`
    mutation {
      createTask(input: {title: "a"}) {
        task {
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
            "task": {
              "message": "The Title: Too short",
              "modelState": [
                {
                  "field": "title",
                  "message": "Too short",
                },
              ],
            },
          },
        },
      }
    `)
  })

  it("test graphql", async () => {
    await remult.repo(Task).insert([{ title: "task c" }])
    await remult.repo(Task).insert([{ title: "task b" }])
    await remult.repo(Task).insert([{ title: "task a" }])
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

  it("test basics", async () => {
    // rmv removeComments is very handy for testing!
    const { typeDefs } = remultGraphql({
      entities: [Task, Category],
      removeComments: true
    })

    expect(typeDefs).toMatchInlineSnapshot(`
      "type Query {
          task(id: ID!): Task
          tasks(limit: Int, page: Int, orderBy: tasksOrderBy, where: tasksWhere): TaskConnection
          category(id: ID!): Category
          categories(limit: Int, page: Int, orderBy: categoriesOrderBy, where: categoriesWhere): CategoryConnection
          node(nodeId: ID!): Node
      }

      type Mutation {
          createTask(input: CreateTaskInput!, clientMutationId: String): CreateTaskPayload
          updateTask(id: ID!, patch: UpdateTaskInput!, clientMutationId: String): UpdateTaskPayload
          deleteTask(id: ID!, clientMutationId: String): DeleteTaskPayload
          createCategory(input: CreateCategoryInput!, clientMutationId: String): CreateCategoryPayload
          updateCategory(id: ID!, patch: UpdateCategoryInput!, clientMutationId: String): UpdateCategoryPayload
          deleteCategory(id: ID!, clientMutationId: String): DeleteCategoryPayload
      }

      type Task implements Node {
          id: Int!
          title: String!
          completed: Boolean!
          thePriority: String!
          category: Category
          userOnServer: String!
          nodeId: ID!
      }

      input tasksOrderBy {
        id: OrderByDirection
        title: OrderByDirection
        completed: OrderByDirection
        thePriority: OrderByDirection
        category: OrderByDirection
      }

      input tasksWhere {
        id: WhereInt
        title: WhereString
        completed: WhereBoolean
        thePriority: WhereString
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
          userOnServer: String
      }

      type CreateTaskPayload {
          task: CreateTaskOrError
          clientMutationId: String
      }

      union CreateTaskOrError = Task | ValidationError

      input UpdateTaskInput {
          title: String
          completed: Boolean
          thePriority: String
          category: ID
          userOnServer: String
      }

      type UpdateTaskPayload {
          task: Task
          clientMutationId: String
      }

      type DeleteTaskPayload {
          id: ID
          clientMutationId: String
      }

      type Category implements Node {
          id: String!
          name: String!
          tasks(limit: Int, page: Int, orderBy: tasksOrderBy, where: tasksWhere): TaskConnection
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
          category: CreateCategoryOrError
          clientMutationId: String
      }

      union CreateCategoryOrError = Category | ValidationError

      input UpdateCategoryInput {
          name: String
      }

      type UpdateCategoryPayload {
          category: Category
          clientMutationId: String
      }

      type DeleteCategoryPayload {
          id: ID
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
          st: String
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
          st: String
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
      "
    `)
  })
  it("test allow api delete", async () => {
    const C = class {
      id = 0
    }
    describeClass(C, Entity("cs", { allowApiCrud: true, allowApiDelete: false }), {
      id: Fields.integer()
    })
    // rmv removeComments is very handy for testing!
    const { typeDefs } = remultGraphql({
      entities: [C],
      removeComments: true
    })

    expect(typeDefs).toMatchInlineSnapshot(`
      "type Query {
          c(id: ID!): C
          cs(limit: Int, page: Int, orderBy: csOrderBy, where: csWhere): CConnection
          node(nodeId: ID!): Node
      }

      type Mutation {
          createC(input: CreateCInput!, clientMutationId: String): CreateCPayload
          updateC(id: ID!, patch: UpdateCInput!, clientMutationId: String): UpdateCPayload
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
          c: CreateCOrError
          clientMutationId: String
      }

      union CreateCOrError = C | ValidationError

      input UpdateCInput {
          id: Int
      }

      type UpdateCPayload {
          c: C
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
          st: String
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
          st: String
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
      "
    `)
  })
  it("test allow api create", async () => {
    const C = class {
      id = 0
    }
    describeClass(C, Entity("cs", { allowApiCrud: true, allowApiInsert: false }), {
      id: Fields.integer()
    })
    // rmv removeComments is very handy for testing!
    const { typeDefs } = remultGraphql({
      entities: [C],
      removeComments: true
    })

    expect(typeDefs).toMatchInlineSnapshot(`
      "type Query {
          c(id: ID!): C
          cs(limit: Int, page: Int, orderBy: csOrderBy, where: csWhere): CConnection
          node(nodeId: ID!): Node
      }

      type Mutation {
          updateC(id: ID!, patch: UpdateCInput!, clientMutationId: String): UpdateCPayload
          deleteC(id: ID!, clientMutationId: String): DeleteCPayload
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
          clientMutationId: String
      }

      type DeleteCPayload {
          id: ID
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
          st: String
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
          st: String
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
      "
    `)
  })
  it("test allow api create", async () => {
    const C = class {
      id = 0
    }
    describeClass(C, Entity("cs", { allowApiCrud: false }), {
      id: Fields.integer()
    })
    // rmv removeComments is very handy for testing!
    const { typeDefs } = remultGraphql({
      entities: [C],
      removeComments: true
    })

    expect(typeDefs).toMatchInlineSnapshot(`
      "type Query {
          c(id: ID!): C
          cs(limit: Int, page: Int, orderBy: csOrderBy, where: csWhere): CConnection
          node(nodeId: ID!): Node
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

      input WhereString {
          eq: String
          ne: String
          in: [String!]
          nin: [String!]
          gt: String
          gte: String
          lt: String
          lte: String
          st: String
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
          st: String
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
      "
    `)
  })
})
