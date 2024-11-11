import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import {
  Entity,
  FieldRef,
  Fields,
  InMemoryDataProvider,
  Relations,
  Remult,
  Validators,
  getEntityRef,
  getValueList,
  valueValidator,
} from '../../core'
import {
  createValueValidator,
  createValueValidatorWithArgs,
} from '../../core/src/validators'
import { beforeEach } from 'vitest'
import { entity } from './dynamic-classes'
import { validateHeaderName } from 'http'
import { cast } from '../../core/src/isOfType.js'
import { ValueConverters } from '../../core/index.js'

describe('validation tests', () => {
  const remult = new Remult(new InMemoryDataProvider())
  beforeEach(() => {
    remult.dataProvider = new InMemoryDataProvider()
  })
  it('test required validator', async () => {
    @Entity('x', {})
    class x {
      @Fields.number()
      id = 0
      @Fields.string({ validate: Validators.required })
      title = ''
    }
    expect(async () => await remult.repo(x).insert({ id: 1 })).rejects
      .toThrowErrorMatchingInlineSnapshot(`
    {
      "message": "Title: Should not be empty",
      "modelState": {
        "title": "Should not be empty",
      },
    }
  `)
  })
  beforeEach(() => {
    let x = Validators.required.defaultMessage
    return () => (Validators.required.defaultMessage = x)
  })
  it('test custom message', async () => {
    Validators.required.defaultMessage = 'a custom message'
    expect(Validators.required.defaultMessage).toBe('a custom message')
  })

  it('test it', async () => {
    expect(Validators.required.defaultMessage).toMatchInlineSnapshot(
      '"Should not be empty"',
    )
  })
  it('test required validator 2', async () => {
    Validators.required.defaultMessage = 'a custom message'
    @Entity('x', {})
    class x {
      @Fields.number()
      id = 0
      @Fields.string({ validate: Validators.required })
      title = ''
    }
    await expect(async () => await remult.repo(x).insert({ id: 1 })).rejects
      .toThrowErrorMatchingInlineSnapshot(`
        {
          "message": "Title: a custom message",
          "modelState": {
            "title": "a custom message",
          },
        }
      `)
  })
  it('test basic validation with exception', async () => {
    @Entity('x', {})
    class x {
      @Fields.number()
      id = 0
      @Fields.string({
        validate: () => {
          throw 'err'
        },
      })
      title = ''
    }
    expect(async () => await remult.repo(x).insert({ id: 1 })).rejects
      .toThrowErrorMatchingInlineSnapshot(`
    {
      "message": "Title: err",
      "modelState": {
        "title": "err",
      },
    }
  `)
  })
  it('test basic validation with exception', async () => {
    @Entity('x', {})
    class x {
      @Fields.number()
      id = 0
      @Fields.string({
        validate: () => false,
      })
      title = ''
      @Fields.string({
        validate: () => true,
      })
      titleb = ''
      @Fields.string({
        validate: () => 'error',
      })
      titlec = ''
      @Fields.string({
        validate: () => {
          throw 'error'
        },
      })
      titled = ''
      @Fields.string({
        validate: (_, col) => {
          col.error = 'error'
        },
      })
      titlee = ''
    }
    expect(
      async () => await remult.repo(x).insert({ id: 1 }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `
    {
      "message": "Title: invalid value",
      "modelState": {
        "title": "invalid value",
        "titlec": "error",
        "titled": "error",
        "titlee": "error",
      },
    }
  `,
    )
  })
  it('test basic validation with value validator', async () => {
    @Entity('x', {})
    class x {
      @Fields.number({
        validate: valueValidator((v) => v > 0 || 'must be positive'),
      })
      id = 0
      @Fields.number({
        validate: valueValidator((v) => v > 0, 'must be positive'),
      })
      id2 = 0
      @Fields.number({
        validate: valueValidator((v) => v == 0, 'Should show error'),
      })
      id3 = 0
      @Fields.number({
        validate: valueValidator((v) => v != 0),
      })
      id4 = 0
    }
    expect(
      async () => await remult.repo(x).insert({ id: 0 }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `
    {
      "message": "Id: must be positive",
      "modelState": {
        "id": "must be positive",
        "id2": "must be positive",
        "id4": "invalid value",
      },
    }
  `,
    )
  })

  it('test create validator', async () => {
    const val = createValueValidator<number>((x) => x > 0, 'must be positive')
    @Entity('x', {})
    class x {
      @Fields.number({
        validate: val,
      })
      id = 0
      @Fields.number({
        validate: val.withMessage("shouldn't be negative"),
      })
      id2 = 0
      @Fields.number({
        validate: val(),
      })
      id2_1 = 0
      @Fields.number({
        validate: val("shouldn't be negative"),
      })
      id2_2 = 0
      @Fields.number({
        validate: val,
      })
      id3 = 1
    }
    expect(
      async () => await remult.repo(x).insert({ id: 0 }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `
      {
        "message": "Id: must be positive",
        "modelState": {
          "id": "must be positive",
          "id2": "shouldn't be negative",
          "id2_1": "must be positive",
          "id2_2": "shouldn't be negative",
        },
      }
    `,
    )
  })
  it('test create validator with args', async () => {
    const greaterThan = createValueValidatorWithArgs<number, number>(
      (x, arg) => x > arg,
      'must be bigger',
    )

    @Entity('x', {})
    class x {
      @Fields.number({
        validate: greaterThan(2),
      })
      id = 0
      @Fields.number({
        validate: greaterThan(2, "shouldn't be bigger"),
      })
      id2 = 0
      @Fields.number({
        validate: greaterThan(0),
      })
      id3 = 1
    }
    expect(
      async () => await remult.repo(x).insert({ id: 0 }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `
      {
        "message": "Id: must be bigger",
        "modelState": {
          "id": "must be bigger",
          "id2": "shouldn't be bigger",
        },
      }
    `,
    )
  })
  it('test enum 3', async () => {
    enum e {
      a,
      b,
      c,
    }
    @Entity('x', {})
    class x {
      @Fields.enum<x, typeof e>(() => e, {
        saving: (_, x) => {
          x.value == e.a
          let z = x.value
        },
      })
      id!: e
    }

    expect(async () => await remult.repo(x).insert({ id: 'd' as any })).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      {
        "message": "Id: Value must be one of 0, 1, 2",
        "modelState": {
          "id": "Value must be one of 0, 1, 2",
        },
      }
    `)
    expect(await remult.repo(x).insert({ id: e.c })).toMatchInlineSnapshot(`
    x {
      "id": 2,
    }
  `)
    expect(remult.repo(x).metadata.fields.id.valueConverter.fieldTypeInDb).toBe(
      ValueConverters.Integer.fieldTypeInDb,
    )
    expect(cast<InMemoryDataProvider>(remult.dataProvider, 'rows').rows)
      .toMatchInlineSnapshot(`
      {
        "x": [
          {
            "id": 2,
          },
        ],
      }
    `)
  })

  it('test enum', async () => {
    enum e {
      a,
      b,
      c,
    }
    @Entity('x', {})
    class x {
      @Fields.object({
        validate: Validators.enum(e),
      })
      id!: e
    }
    expect(async () => await remult.repo(x).insert({ id: 'd' as any })).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      {
        "message": "Id: Value must be one of 0, 1, 2",
        "modelState": {
          "id": "Value must be one of 0, 1, 2",
        },
      }
    `)
  })
  it('test enum string', async () => {
    enum e {
      a = 'a',
      b = 'b',
      c = 'c',
    }
    @Entity('x', {})
    class x {
      @Fields.object({
        validate: Validators.enum(e),
      })
      id!: e
    }
    expect(async () => await remult.repo(x).insert({ id: 'd' as any })).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      {
        "message": "Id: Value must be one of a, b, c",
        "modelState": {
          "id": "Value must be one of a, b, c",
        },
      }
    `)
    expect(await remult.repo(x).insert({ id: e.c })).toMatchInlineSnapshot(`
      x {
        "id": "c",
      }
    `)
  })
  it('test in ', async () => {
    await expect(async () =>
      remult
        .repo(
          entity('x', {
            id: Fields.number({
              validate: Validators.in([1, 2, 3]),
            }),
          }),
        )
        .insert({ id: 4 }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      {
        "message": "Id: Value must be one of: 1, 2, 3",
        "modelState": {
          "id": "Value must be one of: 1, 2, 3",
        },
      }
    `)
  })
  it('test in ', async () => {
    await expect(async () =>
      remult
        .repo(
          entity('x', {
            id: Fields.number({
              validate: Validators.in(
                [1, 2, 3],
                (x) => 'invalid value: ' + x.join(', '),
              ),
            }),
          }),
        )
        .insert({ id: 4 }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      {
        "message": "Id: invalid value: 1, 2, 3",
        "modelState": {
          "id": "invalid value: 1, 2, 3",
        },
      }
    `)
  })
  it('test in ', async () => {
    const optionalValues = ['new', 'old', 'used'] as const
    await expect(async () =>
      remult
        .repo(
          entity('x', {
            id: Fields.object<any, (typeof optionalValues)[number]>({
              validate: Validators.in(optionalValues),
            }),
          }),
        )
        .insert({ id: 'newxxx' as any }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      {
        "message": "Id: Value must be one of: new, old, used",
        "modelState": {
          "id": "Value must be one of: new, old, used",
        },
      }
    `)
  })
  it('test in 2', async () => {
    const optionalValues = ['new', 'old', 'used'] as const
    await expect(
      await remult
        .repo(
          entity('x', {
            id: Fields.object<any, (typeof optionalValues)[number]>({
              validate: Validators.in(optionalValues),
            }),
          }),
        )
        .insert({ id: 'new' }),
    ).toMatchInlineSnapshot(`
      x {
        "id": "new",
      }
    `)
  })
  it('test in 3', async () => {
    const optionalValues = ['new', 'old', 'used'] as const
    await expect(
      await remult
        .repo(
          entity('x', {
            id: Fields.literal(() => optionalValues),
          }),
        )
        .insert({ id: 'new' }),
    ).toMatchInlineSnapshot(`
      x {
        "id": "new",
      }
    `)
  })
  it('getValueList works on literals', async () => {
    const repo = remult.repo(
      entity('x', { id: Fields.literal(() => ['a', 'b', 'c'] as const) }),
    )
    const valueList = getValueList(repo.fields.id)
    expect(valueList).toEqual(['a', 'b', 'c'])
  })
  it('test in 4', async () => {
    @Entity('x')
    class testEntity {
      @Fields.literal(() => ['open', 'closed'] as const)
      status: 'open' | 'closed' = 'open'
    }
    await expect(
      await remult
        .repo(testEntity)

        .insert({ status: 'open' }),
    ).toMatchInlineSnapshot(`
      testEntity {
        "status": "open",
      }
    `)
  })

  it('test enum 2', async () => {
    enum e {
      a,
      b,
      c,
    }
    @Entity('x', {})
    class x {
      @Fields.object({
        validate: Validators.enum(e),
      })
      id!: e
    }

    await expect(async () => await remult.repo(x).insert({ id: 'd' as any }))
      .rejects.toThrowErrorMatchingInlineSnapshot(`
      {
        "message": "Id: Value must be one of 0, 1, 2",
        "modelState": {
          "id": "Value must be one of 0, 1, 2",
        },
      }
    `)

    expect(await remult.repo(x).insert({ id: e.c })).toMatchInlineSnapshot(`
    x {
      "id": 2,
    }
  `)
  })

  it('test enum 3', async () => {
    enum e {
      a = 'a',
      b = 'b',
      c = 'c',
    }
    @Entity('x', {})
    class x {
      @Fields.enum(() => e)
      id!: e
    }
    expect(async () => await remult.repo(x).insert({ id: 'd' as any })).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      {
        "message": "Id: Value must be one of a, b, c",
        "modelState": {
          "id": "Value must be one of a, b, c",
        },
      }
    `)

    expect(await remult.repo(x).insert({ id: e.c })).toMatchInlineSnapshot(`
    x {
      "id": "c",
    }
  `)
    expect(remult.repo(x).fields.id.valueConverter.toJson(e.a)).toBe('a')
    expect(cast<InMemoryDataProvider>(remult.dataProvider, 'rows').rows)
      .toMatchInlineSnapshot(`
  {
    "x": [
      {
        "id": "c",
      },
    ],
  }
`)

    expect(await remult.repo(x).insert({ id: 'b' as any }))
      .toMatchInlineSnapshot(`
    x {
      "id": "b",
    }
  `)
    expect(getValueList(remult.repo(x).fields.id)).toEqual(['a', 'b', 'c'])
  })
  it('test enum 4', async () => {
    enum e {
      a = 'x',
      b = 'y',
      c = 'z',
    }
    @Entity('x', {})
    class x {
      @Fields.object({
        validate: Validators.enum(e),
      })
      id!: e
    }
    const repo = remult.repo(x)
    expect(async () => await repo.insert({ id: 'd' as any })).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      {
        "message": "Id: Value must be one of x, y, z",
        "modelState": {
          "id": "Value must be one of x, y, z",
        },
      }
    `)

    expect(await repo.insert({ id: e.c })).toMatchInlineSnapshot(`
      x {
        "id": "z",
      }
    `)

    expect(await repo.insert({ id: 'x' as any })).toMatchInlineSnapshot(`
    x {
      "id": "x",
    }
  `)
  })

  describe('test required', async () => {
    @Entity('x', {})
    class x {
      @Fields.string({
        validate: Validators.required,
      })
      id = ''
      @Fields.number({
        validate: Validators.required,
      })
      id2 = 0
      @Fields.date({
        validate: Validators.required,
      })
      id3 = new Date()
    }
    it('test create validator with args, test required', async () => {
      expect(async () => await remult.repo(x).insert({})).rejects
        .toThrowErrorMatchingInlineSnapshot(`
    {
      "message": "Id: Should not be empty",
      "modelState": {
        "id": "Should not be empty",
      },
    }
  `)
    })
    it('test undefined', async () => {
      expect(
        async () =>
          await remult.repo(x).insert({
            id: undefined,
            id2: undefined,
            id3: undefined,
          }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`
    {
      "message": "Id: Should not be empty",
      "modelState": {
        "id": "Should not be empty",
        "id2": "Should not be empty",
        "id3": "Should not be empty",
      },
    }
  `)
    })
    it('test null', async () => {
      expect(
        async () =>
          await remult.repo(x).insert({
            id: null!,
            id2: null!,
            id3: null!,
          }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`
    {
      "message": "Id: Should not be empty",
      "modelState": {
        "id": "Should not be empty",
        "id2": "Should not be empty",
        "id3": "Should not be empty",
      },
    }
  `)
    })

    it('test valid values', async () => {
      expect(
        await remult.repo(x).insert({
          id: '1',
          id2: 1,
          id3: new Date('2024-01-03T10:37:10.787Z'),
        }),
      ).toMatchInlineSnapshot(`
    x {
      "id": "1",
      "id2": 1,
      "id3": 2024-01-03T10:37:10.787Z,
    }
  `)
    })
  })
  describe('test required option', async () => {
    @Entity('x', {})
    class x {
      @Fields.string({
        required: true,
      })
      id = ''
      @Fields.number({
        required: true,
      })
      id2 = 0
      @Fields.date({
        required: true,
      })
      id3 = new Date()
    }
    it('test create validator with args, test required', async () => {
      expect(async () => await remult.repo(x).insert({})).rejects
        .toThrowErrorMatchingInlineSnapshot(`
    {
      "message": "Id: Should not be empty",
      "modelState": {
        "id": "Should not be empty",
      },
    }
  `)
    })
    it('test undefined', async () => {
      expect(
        async () =>
          await remult.repo(x).insert({
            id: undefined,
            id2: undefined,
            id3: undefined,
          }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`
    {
      "message": "Id: Should not be empty",
      "modelState": {
        "id": "Should not be empty",
        "id2": "Should not be empty",
        "id3": "Should not be empty",
      },
    }
  `)
    })
    it('test null', async () => {
      expect(
        async () =>
          await remult.repo(x).insert({
            id: null!,
            id2: null!,
            id3: null!,
          }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`
    {
      "message": "Id: Should not be empty",
      "modelState": {
        "id": "Should not be empty",
        "id2": "Should not be empty",
        "id3": "Should not be empty",
      },
    }
  `)
    })

    it('test valid values', async () => {
      expect(
        await remult.repo(x).insert({
          id: '1',
          id2: 1,
          id3: new Date('2024-01-03T10:37:10.787Z'),
        }),
      ).toMatchInlineSnapshot(`
    x {
      "id": "1",
      "id2": 1,
      "id3": 2024-01-03T10:37:10.787Z,
    }
  `)
    })
  })
  describe('relation', () => {
    @Entity('cat', {})
    class cat {
      @Fields.integer()
      id = 0
      @Fields.string()
      name = ''
    }
    @Entity('x', {})
    class x {
      @Fields.number()
      id = 0
      @Relations.toOne(() => cat, {
        validate: Validators.relationExists,
      })
      id2!: cat
    }
    beforeEach(async () => {
      await remult.repo(cat).insert({ id: 1, name: 'a' })
    })
    it('relation', async () => {
      await expect(
        async () => await remult.repo(x).insert({ id: 1, id2: 2 as any }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`
      {
        "message": "Id2: Relation value does not exist",
        "modelState": {
          "id2": "Relation value does not exist",
        },
      }
    `)
    })
    it('relation 2', async () => {
      await expect(
        async () =>
          await remult.repo(x).insert({ id: 1, id2: { id: 2, name: 'asdf' } }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`
      {
        "message": "Id2: Relation value does not exist",
        "modelState": {
          "id2": "Relation value does not exist",
        },
      }
    `)
    })
    it('relation 3', async () => {
      await expect(
        async () =>
          await remult
            .repo(x)
            .insert(remult.repo(x).fromJson({ id: 1, id2: 2 }, true)),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`
      {
        "message": "Id2: Relation value does not exist",
        "modelState": {
          "id2": "Relation value does not exist",
        },
      }
    `)
    })
    it('relation 4', async () => {
      await expect(
        await remult.repo(x).insert({ id: 1, id2: { id: 1, name: 'a' } }),
      ).toMatchInlineSnapshot(`
        x {
          "id": 1,
          "id2": cat {
            "id": 1,
            "name": "a",
          },
        }
      `)
    })
    it('test from json', async () => {
      expect(
        getEntityRef(
          remult.repo(x).fromJson({ id: 1, id2: 1 }),
        ).fields.id2.getId(),
      ).toBe(1)
    })

    it('relation 5', async () => {
      await expect(
        await remult
          .repo(x)
          .insert(remult.repo(x).fromJson({ id: 1, id2: 1 }, true)),
      ).toMatchInlineSnapshot(`
        x {
          "id": 1,
          "id2": cat {
            "id": 1,
            "name": "a",
          },
        }
      `)
    })
    it('relation 6', async () => {
      await expect(
        await remult
          .repo(x)
          .insert({ id: 1, id2: await remult.repo(cat).findOne() }),
      ).toMatchInlineSnapshot(`
        x {
          "id": 1,
          "id2": cat {
            "id": 1,
            "name": "a",
          },
        }
      `)
    })
  })

  async function insertId(remultEntity: any, id: number | string) {
    return await remult.repo(remultEntity).insert({id});
  }

  describe('biggerThan', () => {
    it('should throw if value is smaller than input', async () => {
      const numberEntity = entity('x', {
        id: Fields.number({validate: Validators.biggerThan(5)})
      });
      
      await expect(() => insertId(numberEntity, 4)).rejects.toThrowErrorMatchingInlineSnapshot(`
        {
          "message": "Id: Value must be bingger than 5",
          "modelState": {
            "id": "Value must be bingger than 5",
          },
        }
      `)
    });

    it('should return the entity if value is bigger than input', async () => {
      const numberEntity = entity('x', {
        id: Fields.number({validate: Validators.biggerThan(5)})
      });
      const result = await insertId(numberEntity, 6) as any;
      expect(result.id).toBe(6);
    });
  });

  describe('smallerThan', () => {
    it('should throw if value is bigger than input', async () => {
      let error;

      const numberEntity = entity('x', {
        id: Fields.number({validate: Validators.smallerThan(5)})
      });

      await expect(() => insertId(numberEntity, 6)).rejects.toThrowErrorMatchingInlineSnapshot(`
        {
          "message": "Id: Value must be smaller than 5",
          "modelState": {
            "id": "Value must be smaller than 5",
          },
        }
      `);
    });

    it('should return the entity if value is smaller than input', async () => {
      const numberEntity = entity('x', {
        id: Fields.number({validate: Validators.smallerThan(5)})
      });
      const result = await insertId(numberEntity, 4) as any;
      expect(result.id).toBe(4);
    });
  });

  it('test max length', async () => {
    await expect(
      async () =>
        await remult
          .repo(
            entity('x', {
              id: Fields.string({ validate: Validators.minLength(5) }),
            }),
          )
          .insert({ id: '1234' }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      {
        "message": "Id: Value must be at least 5 characters",
        "modelState": {
          "id": "Value must be at least 5 characters",
        },
      }
    `)
  })
  it('test max length', async () => {
    @Entity('x', {})
    class x {
      @Fields.string({
        maxLength: 5,
      })
      id = ''
    }
    await expect(remult.repo(x).insert({ id: '1234567' })).rejects
      .toMatchInlineSnapshot(`
      {
        "message": "Id: Value must be at most 5 characters",
        "modelState": {
          "id": "Value must be at most 5 characters",
        },
      }
    `)
    expect(remult.repo(x).insert({ id: '1234' })).resolves
      .toMatchInlineSnapshot(`
      x {
        "id": "1234",
      }
    `)
  })
  it('test min length', async () => {
    @Entity('x', {})
    class x {
      @Fields.string({
        minLength: 2,
      })
      id = ''
    }
    await expect(remult.repo(x).insert({ id: 'o' })).rejects
      .toMatchInlineSnapshot(`
      {
        "message": "Id: Value must be at least 2 characters",
        "modelState": {
          "id": "Value must be at least 2 characters",
        },
      }
    `)
    expect(remult.repo(x).insert({ id: '1234' })).resolves
      .toMatchInlineSnapshot(`
      x {
        "id": "1234",
      }
    `)
  })
  it('test value converters error', async () => {
    await expect(() =>
      remult
        .repo(
          entity('x', {
            id: Fields.number({
              valueConverter: {
                toJson: () => {
                  throw 'err'
                },
              },
            }),
          }),
        )
        .insert({ id: 1 }),
    ).rejects.toMatchInlineSnapshot(`
    {
      "message": "Id: toJson failed for value 1. Error: err",
      "modelState": {
        "id": "toJson failed for value 1. Error: err",
      },
    }
  `)
  })
  it('test value converters error', async () => {
    await expect(() =>
      remult
        .repo(
          entity('x', {
            id: Fields.number({
              valueConverter: {
                toJson: () => {
                  throw 'err'
                },
              },
            }),
          }),
        )
        .metadata.fields.id.valueConverter.toJson(1),
    ).toThrowErrorMatchingInlineSnapshot(`
      {
        "message": "Id: toJson failed for value 1. Error: err",
        "modelState": {
          "id": "toJson failed for value 1. Error: err",
        },
      }
    `)
  })
  it('test unique works', async () => {
    const repo = remult.repo(
      entity('x', {
        id: Fields.string({ validate: Validators.unique }),
        name: Fields.string(),
      }),
    )
    const r = await repo.insert({ id: '1', name: 'a' })
    r.name = 'b'
    await getEntityRef(r).save()
  })
  it('test number with nan', async () => {
    const repo = remult.repo(
      entity('x', {
        id: Fields.number(),
      }),
    )
    await expect(() => repo.insert({ id: NaN })).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      {
        "message": "Id: Invalid value",
        "modelState": {
          "id": "Invalid value",
        },
      }
    `)
  })
  it('test number with nan and required', async () => {
    const repo = remult.repo(
      entity('x', {
        id: Fields.number({ validate: Validators.required }),
      }),
    )
    await expect(() => repo.insert({ id: NaN })).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      {
        "message": "Id: Invalid value",
        "modelState": {
          "id": "Invalid value",
        },
      }
    `)
  })
  it('test integer with nan', async () => {
    const repo = remult.repo(
      entity('x', {
        id: Fields.integer(),
      }),
    )
    await expect(() => repo.insert({ id: NaN })).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      {
        "message": "Id: Invalid value",
        "modelState": {
          "id": "Invalid value",
        },
      }
    `)
  })
})
