import { Remult } from "../context";
import { ErrorInfo } from "../data-interfaces";
import { InMemoryDataProvider } from "../data-providers/in-memory-database";
import { remult } from "../remult-proxy";
import { columnsOfType, controllerRefImpl, Field, Fields, getControllerRef, getFields, InferMemberType, TransferEntityAsIdFieldOptions, ValueListFieldType } from "../remult3";
import { createClass, describeClass } from "../remult3/DecoratorReplacer";
import { BackendMethod, createBackendMethod, BackendMethodType, CreateBackendMethodOptions, InferredMethodType, prepareArgsToSend, prepareReceivedArgs } from "../server-action";
import { Validators } from "../validators";
import { ValueConverters } from "../valueConverters";
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
        availableFrom: new Date(1976, 5, 16).toISOString(),
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
it("test Array", async () => {
  const t = createClass({
    a: Fields.string(),
    b: Fields.array(() => classToTestTypedArguments)
  });
  let v = new t();
  v = {
    a: 'honig', b: [
      { a: 'noam', b: new Date(1976, 5, 16) },
      { a: 'yael', b: new Date(1978, 2, 15) }
    ]
  };
  const ar = prepareArgsToSend([t], [v]);
  expect(ar).toEqual([{
    a: 'honig', b: [
      { a: 'noam', b: '1976-06-16' },
      { a: 'yael', b: '1978-03-15' }
    ]
  }])
  const res = await prepareReceivedArgs([t], ar);
  expect(res[0].b[0].b.getFullYear()).toBe(1976);
  expect(res[0].b[1].b.getFullYear()).toBe(1978);
});
it("test Array2", async () => {
  const t = createClass({
    a: Fields.string(),
    b: Fields.array(Field(() => classToTestTypedArguments))
  });
  let v = new t();
  v = {
    a: 'honig', b: [
      { a: 'noam', b: new Date(1976, 5, 16) },
      { a: 'yael', b: new Date(1978, 2, 15) }
    ]
  };
  const ar = prepareArgsToSend([t], [v]);
  expect(ar).toEqual([{
    a: 'honig', b: [
      { a: 'noam', b: '1976-06-16' },
      { a: 'yael', b: '1978-03-15' }
    ]
  }])
  const res = await prepareReceivedArgs([t], ar);
  expect(res[0].b[0].b.getFullYear()).toBe(1976);
  expect(res[0].b[1].b.getFullYear()).toBe(1978);
});
it("test Array3", async () => {
  const t = createClass({
    a: Fields.string(),
    b: Fields.array(classToTestTypedArguments)
  });
  let v = new t();
  v = {
    a: 'honig', b: [
      { a: 'noam', b: new Date(1976, 5, 16) },
      { a: 'yael', b: new Date(1978, 2, 15) }
    ]
  };
  const ar = prepareArgsToSend([t], [v]);
  expect(ar).toEqual([{
    a: 'honig', b: [
      { a: 'noam', b: '1976-06-16' },
      { a: 'yael', b: '1978-03-15' }
    ]
  }])
  const res = await prepareReceivedArgs([t], ar);
  expect(res[0].b[0].b.getFullYear()).toBe(1976);
  expect(res[0].b[1].b.getFullYear()).toBe(1978);
});
it("test Array3", async () => {
  const t = createClass({
    a: Fields.string(),
    b: Fields.array(createClass({
      a: Fields.string(),
      b: Fields.dateOnly()
    }))
  });
  let v = new t();
  v = {
    a: 'honig', b: [
      { a: 'noam', b: new Date(1976, 5, 16) },
      { a: 'yael', b: new Date(1978, 2, 15) }
    ]
  };
  const ar = prepareArgsToSend([t], [v]);
  expect(ar).toEqual([{
    a: 'honig', b: [
      { a: 'noam', b: '1976-06-16' },
      { a: 'yael', b: '1978-03-15' }
    ]
  }])
  const res = await prepareReceivedArgs([t], ar);
  expect(res[0].b[0].b.getFullYear()).toBe(1976);
  expect(res[0].b[1].b.getFullYear()).toBe(1978);
});
it("test Array4", async () => {
  const t = createClass({
    a: Fields.string(),
    b: Fields.array({
      a: Fields.string(),
      b: Fields.dateOnly()
    })
  });
  let v = new t();
  v = {
    a: 'honig', b: [
      { a: 'noam', b: new Date(1976, 5, 16) },
      { a: 'yael', b: new Date(1978, 2, 15) }
    ]
  };
  const ar = prepareArgsToSend([t], [v]);
  expect(ar).toEqual([{
    a: 'honig', b: [
      { a: 'noam', b: '1976-06-16' },
      { a: 'yael', b: '1978-03-15' }
    ]
  }])
  const res = await prepareReceivedArgs([t], ar);
  expect(res[0].b[0].b.getFullYear()).toBe(1976);
  expect(res[0].b[1].b.getFullYear()).toBe(1978);
});

it("test array typing starting point", () => {
  let t: { a: string, b: { c: string } }[];
  let y: keyof typeof t[0] = "a";
  let z: typeof t[0];
  let zz: keyof typeof z.b = "c";;
});
it("test infer member type", () => {
  function inferType<T>(x: T): InferMemberType<T> {
    return undefined;
  }
  {
    let x = inferType(Field(() => String));
    x = "a string is valid here";
  }
  {
    let x = inferType(Field(() => classToTestTypedArguments));
    let z: keyof typeof x = "a";
    expect(z).toBe("a");
  }
  {
    let x = inferType(classToTestTypedArguments);
    let z: keyof typeof x = "a";
    expect(z).toBe("a");
  }
  {
    let x = inferType(() => classToTestTypedArguments);
    let z: keyof InstanceType<typeof x> = "a";
    expect(z).toBe("a");
  }
  {
    let x = inferType(Fields.array(() => classToTestTypedArguments));
    let z: keyof typeof x[0] = 'a';
  }
  {
    let x = inferType(Fields.array(classToTestTypedArguments));
    let z: keyof typeof x[0] = 'a';
  }
  {
    let a = Field(() => classToTestTypedArguments);
    let b = Fields.array(a);
    let x = inferType(b);
    let z: keyof typeof x[0] = 'a';
  }
  {
    let x = inferType(Fields.array({
      a: Fields.string()
    }));
    let z: keyof typeof x[0] = 'a';
  }

});
it("test create class further", () => {
  const t = createClass({
    a: Fields.string()
  });
  expect(getFields(new t()).a.metadata.valueType).toBe(String);
});
it("test create class further 2", () => {
  const t = createClass({
    a: Field(() => classToTestTypedArguments),
    b: classToTestTypedArguments
  });
  expect(getFields(new t()).a.metadata.valueType).toBe(classToTestTypedArguments);
  expect(getFields(new t()).b.metadata.valueType).toBe(classToTestTypedArguments);
});
it("test create class further 3", () => {
  const t = createClass({
    a: String,
  });
  expect(getFields(new t()).a.metadata.valueType).toBe(String);
});
it("test create class further 4", () => {
  const t = createClass({
    a: {
      b: String,
      c: classToTestTypedArguments
    },
  });
  let cols = columnsOfType.get(getFields(new t()).a.metadata.valueType)
  expect(cols.length).toBe(2);
});
it("test parameter decorator", () => {
  const r = new Remult();
  r.apiClient.httpClient = {
    delete: () => undefined,
    get: () => undefined,
    post: async (url, data) => {
      expect(data.args[0]).toEqual("1976-06-16");
      return { data: { result: "hello noam" } };
    },
    put: () => undefined
  };
  r.call(TestBackendMethodWithParameterDecorator.testBackendWithParameters, undefined, new Date(1976, 5, 16));
});
class TestBackendMethodWithParameterDecorator {
  @BackendMethod({ allowed: true })
  static async testBackendWithParameters(@Fields.dateOnly() a: Date) {

  }
}

it("start build backend method", async () => {
  let m = createBackendMethod("ghi", {
    inputType: Fields.dateOnly(),
    returnType: Number,
    allowed: true,
    implementation: async d => d.getFullYear(),
  });
  expect(await m(new Date(1976, 5, 16))).toBe(1976);
  expect(await m.implementation(new Date(1976, 5, 16))).toBe(1976);
  m.implementation = async (d) => d.getFullYear() + 46;
  expect(await m.implementation(new Date(1976, 5, 16))).toBe(2022);
  expect(await m(new Date(1976, 5, 16))).toBe(2022);
});
it("test replace implementation", async () => {
  let m = createBackendMethod("abc", {
    inputType: Fields.dateOnly(),
    returnType: Number,
    allowed: true,
    implementation: async d => d.getFullYear(),

  });
  m.implementation = async (d) => d.getFullYear() + 46;
  expect(await m.implementation(new Date(1976, 5, 16))).toBe(2022);
  expect(await m(new Date(1976, 5, 16))).toBe(2022);
});
it("start build backend method 2", async () => {
  let m = createBackendMethod("def", {
    inputType: {
      a: Fields.dateOnly(),
      b: String
    },
    returnType: String,
    allowed: true,
    implementation: async ({ a, b }) => a.getFullYear().toString() + b
  });
  expect(await m({ a: new Date(1976, 5, 16), b: "noam" })).toBe("1976noam");
});
it("start build backend method 3", async () => {
  let x = class {
    a = new Date();
    b = '';
  }
  describeClass(x, undefined, {
    a: Fields.date(),
    b: Fields.string()
  })
  let m = createBackendMethod("def", {
    inputType: x,
    returnType: String,
    allowed: true,
    implementation: async ({ a, b }) => a.getFullYear().toString() + b
  });
  expect(await m({ a: new Date(1976, 5, 16), b: "noam" })).toBe("1976noam");
});
it("start build backend method 3_1", async () => {
  let x = class {
    a = new Date();
    b = '';
  }
  describeClass(x, undefined, {
    a: Fields.date(),
    b: Fields.string()
  })
  let m = createBackendMethod("def", {
    inputType: Field(() => x),
    returnType: String,
    allowed: true,
    implementation: async ({ a, b }) => a.getFullYear().toString() + b
  });
  expect(await m({ a: new Date(1976, 5, 16), b: "noam" })).toBe("1976noam");
});
class myClass4 {
  @Fields.date()
  a = new Date();
  @Fields.string()
  b = '';
}
it("start build backend method 4", async () => {


  let m = createBackendMethod("def", {
    inputType: myClass4,
    returnType: String,
    allowed: true,
    implementation: async ({ a, b }) => a.getFullYear().toString() + b
  });
  expect(await m({ a: new Date(1976, 5, 16), b: "noam" })).toBe("1976noam");
});
it("start build backend method 4_1", async () => {


  let m = createBackendMethod("def", {
    inputType: Field(() => myClass4),
    returnType: String,
    allowed: true,
    implementation: async ({ a, b }) => a.getFullYear().toString() + b
  });
  expect(await m({ a: new Date(1976, 5, 16), b: "noam" })).toBe("1976noam");
});
it("start build backend method with allowed", async () => {
  let m = createBackendMethod("a1", {
    inputType: {
      a: Fields.dateOnly(),
      b: String
    },
    returnType: String,
    allowed: ( y) => y.a.getFullYear() === 1976,
    implementation: async ({ a, b }) => a.getFullYear().toString() + b
  });
  expect(await m({ a: new Date(1976, 5, 16), b: "noam" })).toBe("1976noam");
  let ok = true;
  try {
    expect(await m({ a: new Date(1975, 5, 16), b: "noam" }));
    ok = false;
  }
  catch {
    ok = true;
  }
  expect(ok).toBe(true);
});



function build<T>(what: T): inferMethods<T> {

  return undefined;
}

declare type inferMethods<type> = {
  [member in keyof type]: type[member] extends BackendMethodType<infer R, infer S> ? InferredMethodType<R, S> : never
}



it("test that it works", async () => {
  expect(await CompareBackendMethodCalls.m1(new Date(1976, 5, 16))).toBe(1976);
  expect(await CompareBackendMethodCalls.m2(new Date(1976, 5, 16))).toBe(1976);
  expect(await CompareBackendMethodCalls.m3(new Date(1976, 5, 16))).toBe(1976);
  if (false)
    z.m4(new Date(1976, 6, 16));
});

it("test validation", async () => {
  const m = createBackendMethod("t1", {
    inputType: {
      a: Fields.string({ validate: Validators.required })
    },
    returnType: String,
    allowed: true,
    implementation: async x => x.a + "z"
  })
  let ok = true;
  try {
    await m({ a: "" })
    ok = false;
  }
  catch (err: any) {
    expect(err.modelState.a).toBe("Should not be empty");
  }
  expect(ok).toBe(true);
  expect(await m({ a: "noam" })).toBe("noamz");

});
it("test validation 1", async () => {
  const m = createBackendMethod("t1", {
    inputType: 
       Fields.string({ validate: Validators.required })
    ,
    returnType: String,
    allowed: true,
    implementation: async x => x + "z"
  })
  let ok = true;
  try {
    await m( "" )
    ok = false;
  }
  catch (err: any) {
    expect(err.modelState.a).toBe("Should not be empty");
  }
  expect(ok).toBe(true);
  expect(await m("noam")).toBe("noamz");

  });


class CompareBackendMethodCalls {
  @BackendMethod({
    allowed: true,
    paramTypes: [Fields.dateOnly()],
    returnType: Number
  })
  static async m1(d: Date) {
    return d.getFullYear()
  }
  @BackendMethod({
    allowed: true,
    returnType: Number
  })
  static async m2(@Fields.dateOnly() d: Date) {
    return d.getFullYear()
  }

  static m3 = createBackendMethod("m3", {
    allowed: true,
    inputType: Fields.dateOnly(),
    returnType: Number,
    implementation:
      async d => d.getFullYear(),
  })
}

let z = build({
  m4: createBackendMethod("m4", {
    allowed: true,
    inputType: Fields.dateOnly(),
    returnType: Number,
    implementation:
      async d => d.getFullYear()
  })
});

