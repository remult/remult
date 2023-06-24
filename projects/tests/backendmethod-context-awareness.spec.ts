import { AsyncLocalStorage } from "async_hooks";
import { BackendMethod, Entity, Fields, InMemoryDataProvider, describeClass, remult } from "../core";
import { initAsyncHooks } from "../core/server/initAsyncHooks";
import { Remult, RemultAsyncLocalStorage } from "../core/src/context";

describe("backend method context awareness", () => {
  it("getting error when async was initialized", async () => {
    let ok = true;
    try {

      RemultAsyncLocalStorage.instance = new RemultAsyncLocalStorage(new AsyncLocalStorage());
      RemultAsyncLocalStorage.enable();
      if (remult.authenticated()) {

      }
      ok = false;
    } catch { ok = true } finally {
      RemultAsyncLocalStorage.instance = new RemultAsyncLocalStorage(undefined!);
      RemultAsyncLocalStorage.disable();
    }
    expect(ok).toBe(true)

  })
  it("test run works", () => {
    try {
      RemultAsyncLocalStorage.instance = new RemultAsyncLocalStorage(new AsyncLocalStorage());
      RemultAsyncLocalStorage.enable();
      let ok = false;
      Remult.run(() => {
        let x = remult.user
        ok = true;
      })
      expect(ok).toBe(true);
    }
    finally {
      RemultAsyncLocalStorage.instance = new RemultAsyncLocalStorage(undefined!);
      RemultAsyncLocalStorage.disable();
    }
  })
  it("test run works and returns", () => {
    try {
      RemultAsyncLocalStorage.instance = new RemultAsyncLocalStorage(new AsyncLocalStorage());
      RemultAsyncLocalStorage.enable();
      let ok = false;
      expect(Remult.run(() => {
        let x = remult.user
        ok = true;
        return 77;
      })).toBe(77)
      expect(ok).toBe(true);
    }
    finally {
      RemultAsyncLocalStorage.instance = new RemultAsyncLocalStorage(undefined!);
      RemultAsyncLocalStorage.disable();
    }
  })
  it("test run works and returns Promise", async () => {
    try {
      RemultAsyncLocalStorage.instance = new RemultAsyncLocalStorage(new AsyncLocalStorage());
      RemultAsyncLocalStorage.enable();
      let ok = false;
      expect(await Remult.run(async () => {
        remult.dataProvider = new InMemoryDataProvider();
        var c = class {
          id = 0
        }
        describeClass(c, Entity(""), {
          id: Fields.integer()
        })
        await remult.repo(c).insert([{ id: 1 }, { id: 2 }])
        ok = true;
        return await remult.repo(c).count()
      })).toBe(2)
      expect(ok).toBe(true);
    }
    finally {
      RemultAsyncLocalStorage.instance = new RemultAsyncLocalStorage(undefined!);
      RemultAsyncLocalStorage.disable();
    }
  })


  it("testing ", async () => {
    let wasCalled = false;
    let c = class {
      static async testingContextAwareness() {
        wasCalled = true
      }
    }
    describeClass(c, undefined, undefined, {
      testingContextAwareness: BackendMethod({ allowed: false })
    })
    await Remult.run(() => {
      remult.dataProvider = new InMemoryDataProvider();
      c.testingContextAwareness();
    })
    expect(wasCalled).toBe(true)
  })
})