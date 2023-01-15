import { ClassType } from "../../classType";
import { Remult, EntityInfo, EntityInfoProvider } from "../context";
import { InMemoryDataProvider } from "../data-providers/in-memory-database";
import { Entity, Fields, Repository } from "../remult3";
import { describeClass } from "../remult3/DecoratorReplacer";
import * as z from 'zod';
import { zodEntity, zodField } from "../../remult-zod";


it("test normal schema", async () => {
  let type = class {
    id: number;
    name: string;
    completed: boolean
  }
  describeClass(type,
    Entity('custom', { allowApiCrud: true }),
    {
      id: Fields.number(),
      name: Fields.string(),
      completed: Fields.boolean()
    })
  const repo = new Remult(new InMemoryDataProvider()).repo(type);
  await repo.insert([
    { id: 1, name: "aa", completed: false },
    { id: 2, name: "ab", completed: true },
    { id: 3, name: "bb", completed: false }])
  expect(await repo.count()).toBe(3);
  expect(await repo.count({ completed: true })).toBe(1);
  expect(await repo.count({ completed: false })).toBe(2);
  expect((await repo.find({ where: { id: 2 } }))[0].completed).toBe(true);
})
interface myInterface {
  id: number,
  name: string,
  completed: boolean
}
it("test alternative schema", async () => {
  let info: EntityInfoProvider<myInterface> = ({
    getEntityInfo: () => ({
      key: "custom",
      options: {
        allowApiCrud: true
      },
      fields: [{
        key: "id",
        valueType: Number
      }, {
        key: "name",
        valueType: String
      }, {
        key: "completed",
        valueType: Boolean
      }]
    })
  });
  const repo = new Remult(new InMemoryDataProvider()).repo(info);
  await repo.insert([
    { id: 1, name: "aa", completed: false },
    { id: 2, name: "ab", completed: true },
    { id: 3, name: "bb", completed: false }])
  expect(await repo.count()).toBe(3);
  expect(await repo.count({ completed: true })).toBe(1);
  expect(await repo.count({ completed: false })).toBe(2);
  expect((await repo.find({ where: { id: 2 } }))[0].completed).toBe(true);
});

it("test remult-zod", async () => {
  let task = zodEntity(
    "custom",
    z.object({
      id: z.number(),
      name: z.string(),
      completed: z.boolean()
    }), {
    allowApiCrud: true
  })
  const repo = new Remult(new InMemoryDataProvider()).repo(task);
  await repo.insert([
    { id: 1, name: "aa", completed: false },
    { id: 2, name: "ab", completed: true },
    { id: 3, name: "bb", completed: false }])
  expect(await repo.count()).toBe(3);
  expect(await repo.count({ completed: true })).toBe(1);
  expect(await repo.count({ completed: false })).toBe(2);
  expect((await repo.find({ where: { id: 2 } }))[0].completed).toBe(true);
});
fit("test remult-zod", async () => {
  let task = zodEntity(
    "custom",
    z.object({
      id: zodField(z.number()),
      name: z.string(),
      completed: z.boolean()
    }), {
    allowApiCrud: true
  })
  const repo = new Remult(new InMemoryDataProvider()).repo(task);
  await repo.insert([
    { name: "aa", completed: false }
  ])
  expect(await repo.count()).toBe(1);
  expect((await repo.find({ where: { id: 1 } }))[0].completed).toBe(false);
});