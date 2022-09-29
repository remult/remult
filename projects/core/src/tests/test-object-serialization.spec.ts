import { Remult } from "../context";
import { InMemoryDataProvider } from "../data-providers/in-memory-database";
import { remult } from "../remult-proxy";
import { controllerRefImpl, Field, Fields, getControllerRef, TransferEntityAsIdFieldOptions, ValueListFieldType } from "../remult3";
import { createClass, describeClass } from "../remult3/DecoratorReplacer";
import { BackendMethod, prepareArgsToSend, prepareReceivedArgs } from "../server-action";
import { createData } from "./createData";
import { Products } from "./remult-3-entities";

it("test basic serialization", async () => {
  const r = class {
    a = '';
    b = 0;
  }
  describeClass(r, undefined, {
    a: Fields.string({
      valueConverter: {
        fromJson: x => x.substring(1),
        toJson: x => "x" + x
      }
    }),
    b: Fields.number()
  })
  let z = new r();
  z.a = 'noam';
  z.b = 77;
  const j = (getControllerRef(z) as unknown as controllerRefImpl).toApiJson();
  expect(j.a).toBe('xnoam');

  const y = new r();
  await (getControllerRef(y) as unknown as controllerRefImpl)._updateEntityBasedOnApi(j);
  expect(y.a).toBe("noam");
});
it("test basic serialization with Date", async () => {
  const r = class {
    a = '';
    b: Date;
  }
  describeClass(r, undefined, {
    a: Fields.string(),
    b: Fields.dateOnly()
  })
  let z = new r();
  z.a = 'noam';
  z.b = new Date(1976, 5, 16);
  const j = (getControllerRef(z) as unknown as controllerRefImpl).toApiJson();
  expect(j.b).toBe('1976-06-16');

  const y = new r();
  await (getControllerRef(y) as unknown as controllerRefImpl)._updateEntityBasedOnApi(j);
  expect(y.b.getFullYear()).toBe(1976);
});
it("test date with backend method", async () => {
  const r = class {
    static async myMethod12(d: Date) {
      return d.getFullYear()
    }
  };
  describeClass(r, undefined, undefined, {
    myMethod12: BackendMethod({ allowed: true, paramTypes: [Fields.dateOnly()] })
  });
  expect(await r.myMethod12(new Date(1976, 5, 16))).toBe(1976);
});
it("test args serialization", async () => {
  const r = prepareArgsToSend([Fields.dateOnly()], [new Date(1976, 5, 16)]);
  expect(r).toEqual(["1976-06-16"]);
});
it("test args deserialization", async () => {
  const r = await prepareReceivedArgs([Fields.dateOnly()], [new Date(1976, 5, 16)]);
  expect(r[0].getFullYear()).toEqual(1976);
});
it("test date with backend method 2", async () => {
  const r = class {
    static async myMethod123() {
      return new Date(1976, 5, 16);
    }
  };
  describeClass(r, undefined, undefined, {
    myMethod123: BackendMethod({
      allowed: true,
      returnType: Fields.dateOnly()
    })
  });
  expect((await r.myMethod123()).getFullYear()).toBe(1976);
});
it("test enum column serialization", async () => {
  class myClass {
    static a = new myClass("aa");
    static b = new myClass("bb");
    constructor(public caption: string) { }
  }
  ValueListFieldType()(myClass);
  let a = prepareArgsToSend([myClass], [myClass.a]);
  expect(a).toEqual(['a']);
  const ar = await prepareReceivedArgs([myClass], a);
  expect(ar[0].caption).toBe('aa');
});
it("test on the fly type", async () => {
  const t = createClass({
    a: Fields.string(),
    b: Fields.dateOnly()
  });
  const v = new t();
  v.a = 'noam';
  v.b = new Date(1976, 5, 16);
  const ar = prepareArgsToSend([t], [v]);
  expect(ar).toEqual([{ a: 'noam', b: '1976-06-16' }])
  const res = await prepareReceivedArgs([t], ar);
  expect(res[0].b.getFullYear()).toBe(1976);
});
it("test on the fly type 2", async () => {
  const t = createClass({
    a: Fields.string(),
    b: Fields.dateOnly()
  });
  let v = new t();
  v = { a: 'noam', b: new Date(1976, 5, 16) };
  const ar = prepareArgsToSend([t], [v]);
  expect(ar).toEqual([{ a: 'noam', b: '1976-06-16' }])
  const res = await prepareReceivedArgs([t], ar);
  expect(res[0].b.getFullYear()).toBe(1976);
})
class classToTestTypedArguments {
  @Fields.string()
  a = '';
  @Fields.dateOnly()
  b!: Date;
}
it("test with class", async () => {
  const v = new classToTestTypedArguments();
  v.a = 'noam';
  v.b = new Date(1976, 5, 16);
  const ar = prepareArgsToSend([classToTestTypedArguments], [v]);
  expect(ar).toEqual([{ a: 'noam', b: '1976-06-16' }])
  const res = await prepareReceivedArgs([classToTestTypedArguments], ar);
  expect(res[0].b.getFullYear()).toBe(1976);
});
it("test with class 2", async () => {
  const v: classToTestTypedArguments = { a: 'noam', b: new Date(1976, 5, 16) };
  const ar = prepareArgsToSend([classToTestTypedArguments], [v]);
  expect(ar).toEqual([{ a: 'noam', b: '1976-06-16' }])
  const res = await prepareReceivedArgs([classToTestTypedArguments], ar);
  expect(res[0].b.getFullYear()).toBe(1976);
});
it("test on the fly type 3", async () => {
  const t = createClass({
    a: Fields.string(),
    b: Field(() => classToTestTypedArguments)
  });
  let v = new t();
  v = { a: 'noam', b: { a: 'yael', b: new Date(1976, 5, 16) } };
  const ar = prepareArgsToSend([t], [v]);
  expect(ar).toEqual([{ a: 'noam', b: { a: 'yael', b: '1976-06-16' } }])
  const res = await prepareReceivedArgs([t], ar);
  expect(res[0].b.b.getFullYear()).toBe(1976);
})
it("test Entity", async () => {
  remult.dataProvider = new InMemoryDataProvider();

  const t = createClass({
    a: Fields.string(),
    b: Field(() => Products)
  });
  let v = new t();
  v = {
    a: 'noam',
    b: {
      id: undefined,
      archived: false,
      availableFrom: new Date(1976, 5, 16),
      name: "beer",
      price: 3.5
    }
  };
  const ar = prepareArgsToSend([t], [v]);
  expect(ar.map(x => ({ a: x.a, b: { data: x.b.data } }))).toEqual([{
    a: 'noam',
    b: {
      data: {
        id: undefined,
        archived: false,
        availableFrom: '1976-06-15T22:00:00.000Z',
        name: "beer",
        price: 3.5
      }
    }
  }])
  const res = await prepareReceivedArgs([t], ar);
  expect(res[0].b.availableFrom.getFullYear()).toBe(1976);
})
it("test Entity ID", async () => {
  remult.dataProvider = new InMemoryDataProvider();

  const t = createClass({
    a: Fields.string(),
    b: Field(() => Products, TransferEntityAsIdFieldOptions)
  });
  let v = new t();
  v = {
    a: 'noam',
    b: {
      id: 1,
      archived: false,
      availableFrom: new Date(1976, 5, 16),
      name: "beer",
      price: 3.5
    }
  };
  const ar = prepareArgsToSend([t], [v]);
  expect(ar).toEqual([{
    a: 'noam',
    b: 1
  }])

})