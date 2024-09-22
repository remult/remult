import { it, describe, expect, beforeEach } from 'vitest'
import {
  Entity,
  Field,
  Fields,
  Remult,
  SqlDatabase,
  type FieldOptions,
} from '../../core'

import { Sqlite3DataProvider } from '../../core/remult-sqlite3.js'

import { SqlDbTests } from './shared-tests/sql-db-tests.js'
import type { DbTestProps } from './shared-tests/db-tests-props.js'
import { Database } from 'sqlite3'
import { allDbTests } from './shared-tests/index.js'

describe('sqlite3', () => {
  let db: SqlDatabase
  let remult: Remult
  let sqliteDatabase: Database
  beforeEach(async () => {
    db = new SqlDatabase(
      new Sqlite3DataProvider((sqliteDatabase = new Database(':memory:'))),
    )
    remult = new Remult(db)
  })
  const props: DbTestProps = {
    getDb() {
      return db
    },
    getRemult() {
      return remult
    },
    createEntity: async (entity) => {
      const repo = remult.repo(entity)
      await db.ensureSchema([repo.metadata])
      return repo
    },
  }

  allDbTests(props)
  SqlDbTests({ ...props })
  it('start works', async () => {
    await db.execute('create table x (id int)')
    await db.execute('insert into x values (1)')
    const r = await db.execute('select * from x')
    expect(r.rows).toMatchInlineSnapshot(`
      [
        {
          "id": 1,
        },
      ]
    `)
    const c = db.createCommand()
    expect((await c.execute(`select * from x where id=${c.param(1)}`)).rows)
      .toMatchInlineSnapshot(`
      [
        {
          "id": 1,
        },
      ]
    `)
  })
  it('test Uint8Array', async () => {
    function Uint8ArrayField<entityType>(options?: FieldOptions<entityType>) {
      return Field(() => Uint8Array, {
        valueConverter: {
          fieldTypeInDb: 'blob',
          fromDb: (v: Buffer) => new Uint8Array(v),
          toDb: (v: Uint8Array) => Buffer.from(v),
        },
        ...options,
      })
    }
    @Entity('passkey_credential')
    class WebAuthnUserCredential {
      @Uint8ArrayField()
      id!: Uint8Array
      @Fields.integer({ dbName: 'user_id' })
      userId!: number
      @Fields.string()
      name!: string
      @Fields.integer({ dbName: 'algorithm' })
      algorithmId!: number
      @Uint8ArrayField({ dbName: 'public_key' })
      publicKey!: Uint8Array
    }

    const repo = await props.createEntity(WebAuthnUserCredential)
    //
    await db.execute(`INSERT INTO passkey_credential (id, user_id, name, algorithm, public_key) 
  VALUES 
      (X'0102030405', 1, 'testUser1', -7, X'0A141E2832'),
      (X'0607080910', 2, 'testUser2', -8, X'1B2C3D4E5F');`)

    expect(await repo.find()).toMatchInlineSnapshot(`
      [
        WebAuthnUserCredential {
          "algorithmId": -7,
          "id": Uint8Array [
            1,
            2,
            3,
            4,
            5,
          ],
          "name": "testUser1",
          "publicKey": Uint8Array [
            10,
            20,
            30,
            40,
            50,
          ],
          "userId": 1,
        },
        WebAuthnUserCredential {
          "algorithmId": -8,
          "id": Uint8Array [
            6,
            7,
            8,
            9,
            16,
          ],
          "name": "testUser2",
          "publicKey": Uint8Array [
            27,
            44,
            61,
            78,
            95,
          ],
          "userId": 2,
        },
      ]
    `)
    expect(await repo.count({ id: new Uint8Array([1, 2, 3, 4, 5]) })).toBe(1)
  })
  it('test blob', async () => {
    function BufferField<entityType>(options?: FieldOptions<entityType>) {
      return Field(() => Buffer, {
        valueConverter: {
          fieldTypeInDb: 'blob',
          fromDb: (v: Buffer) => v,
          toDb: (v: Buffer) => v,
        },
        ...options,
      })
    }
    @Entity('passkey_credential')
    class WebAuthnUserCredential {
      @BufferField()
      id!: Uint8Array
      @Fields.integer({ dbName: 'user_id' })
      userId!: number
      @Fields.string()
      name!: string
      @Fields.integer({ dbName: 'algorithm' })
      algorithmId!: number
      @BufferField({ dbName: 'public_key' })
      publicKey!: Uint8Array
    }

    const repo = await props.createEntity(WebAuthnUserCredential)
    //
    await db.execute(`INSERT INTO passkey_credential (id, user_id, name, algorithm, public_key) 
  VALUES 
      (X'0102030405', 1, 'testUser1', -7, X'0A141E2832'),
      (X'0607080910', 2, 'testUser2', -8, X'1B2C3D4E5F');`)

    expect(await repo.find()).toMatchInlineSnapshot(`
      [
        WebAuthnUserCredential {
          "algorithmId": -7,
          "id": {
            "data": [
              1,
              2,
              3,
              4,
              5,
            ],
            "type": "Buffer",
          },
          "name": "testUser1",
          "publicKey": {
            "data": [
              10,
              20,
              30,
              40,
              50,
            ],
            "type": "Buffer",
          },
          "userId": 1,
        },
        WebAuthnUserCredential {
          "algorithmId": -8,
          "id": {
            "data": [
              6,
              7,
              8,
              9,
              16,
            ],
            "type": "Buffer",
          },
          "name": "testUser2",
          "publicKey": {
            "data": [
              27,
              44,
              61,
              78,
              95,
            ],
            "type": "Buffer",
          },
          "userId": 2,
        },
      ]
    `)
    expect(await repo.count({ id: Buffer.from([1, 2, 3, 4, 5]) })).toBe(1)
  })
})
