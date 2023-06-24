import { Entity, Field, Fields, InMemoryDataProvider, Remult, ValueListFieldType } from "../core";

@ValueListFieldType()
class status {
  static ok = new status()
  static notOk = new status()
  id!: string;
}

@Entity("categories")
class Category {
  @Fields.autoIncrement()
  id = 0;
  @Fields.string()
  name = '';
}

@Entity("tasks")
class Task {
  @Fields.autoIncrement()
  id = 0;
  @Fields.string()
  title = '';
  @Fields.dateOnly()
  dateOnly = new Date(2016, 6, 6, 5)
  @Fields.date()
  date = new Date(2016, 6, 6, 5)
  @Fields.string({ includeInApi: false })
  shouldNotSee = '';
  @Field(() => status)
  status = status.ok;
  @Field(() => Category)
  category?: Category;
}


describe("Test sync from and to json", () => {
  const remult = new Remult(new InMemoryDataProvider())
  const category: Category = {
    id: 1,
    name: "testCat"
  };
  const task1: Task = {
    id: 1,
    title: "test",
    date: new Date(2020, 6, 3, 4),
    dateOnly: new Date(2020, 6, 3, 4),
    shouldNotSee: 'secret',
    status: status.notOk,
    category: category
  }
  const task2: Task = {
    id: 2,
    title: "test2",
    date: new Date(2022, 6, 3, 4),
    dateOnly: new Date(2022, 6, 3, 4),
    shouldNotSee: 'secret',
    status: status.ok,
    category: category
  }
  const repo = remult.repo(Task)

  it("test that it works", () => {
    let theJson = repo.toJson(task1);
    expect(theJson).toMatchInlineSnapshot(`
      {
        "category": {
          "id": 1,
          "name": "testCat",
        },
        "date": "2020-07-03T01:00:00.000Z",
        "dateOnly": "2020-07-03",
        "id": 1,
        "status": "notOk",
        "title": "test",
      }
    `)
    let t = repo.fromJson(theJson);
    expect(t).toMatchInlineSnapshot(`
      Task {
        "category": Category {
          "id": 1,
          "name": "testCat",
        },
        "date": 2020-07-03T01:00:00.000Z,
        "dateOnly": 2020-07-02T21:00:00.000Z,
        "id": 1,
        "shouldNotSee": "",
        "status": status {
          "caption": "Not Ok",
          "id": "notOk",
        },
        "title": "test",
      }
    `);
  })
  it("test category",()=>{
    const t = {...task1};
    const ref = repo.getEntityRef(t);
    expect(ref.fields.category.value?.name).toBe("testCat")
  })
  it ("test with null category",()=>{
    const t = {...task1,category:null};
    expect(repo.fromJson(repo.toJson(t))).toMatchInlineSnapshot(`
      Task {
        "category": null,
        "date": 2020-07-03T01:00:00.000Z,
        "dateOnly": 2020-07-02T21:00:00.000Z,
        "id": 1,
        "shouldNotSee": "",
        "status": status {
          "caption": "Not Ok",
          "id": "notOk",
        },
        "title": "test",
      }
    `)
  })

})
