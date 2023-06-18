import type from 'vitest/globals'
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
import { remultExpress, type RemultExpressServer } from "../core/remult-express"
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

describe("graphql-connection", () => {
  let remult: Remult

  let gql: (gql: string) => Promise<any>
  it("test", async () => {
    expect(1 + 1).toBe(2)
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

    expect(tasks).toMatchSnapshot()
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
    expect(taskNode).toMatchSnapshot()
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
    ).toMatchSnapshot()
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
    expect(result).toMatchSnapshot()
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
    expect(result).toMatchSnapshot()
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
    ).toMatchSnapshot()
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
    ).toMatchSnapshot()
    expect(await remult.repo(Task).find()).toMatchSnapshot()
  })

  it("test mutation create", async () => {
    const result = await gql(`
    mutation {
      createTask(input: {title: "testing"}) {
        task {
          id
          title
        }
      }
    }`)
    expect(result).toMatchSnapshot()
    expect(await remult.repo(Task).find()).toMatchSnapshot()
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
    expect(result).toMatchSnapshot()
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

    expect(result).toMatchSnapshot()
  })

  it("test basics", async () => {
    // rmv removeComments is very handy for testing!
    const { typeDefs } = remultGraphql({
      entities: [Task, Category],
      removeComments: true
    })

    expect(typeDefs).toMatchSnapshot()
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

    expect(typeDefs).toMatchSnapshot()
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

    expect(typeDefs).toMatchSnapshot()
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

    expect(typeDefs).toMatchSnapshot()
  })
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
})
