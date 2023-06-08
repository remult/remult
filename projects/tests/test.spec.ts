
import { Entity, describeClass, Fields, Remult, InMemoryDataProvider } from "../core"

describe("testing", () => {
  it("test", async () => {
    const entity = class {
      id = 0
      name = ''
    }
    describeClass(entity, Entity('tasks'), {
      id: Fields.number(),
      name: Fields.string()
    });
    const repo = new Remult(new InMemoryDataProvider()).repo(entity);
    await repo.insert([{ id: 1, name: "noam" }, { id: 2, name: "yoni" }])
    expect(await repo.find()).toMatchInlineSnapshot(`
      [
        entity {
          "id": 1,
          "name": "noam",
        },
        entity {
          "id": 2,
          "name": "yoni",
        },
      ]
    `)
  }
  )
})