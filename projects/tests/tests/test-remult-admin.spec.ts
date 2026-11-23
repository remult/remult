import { buildEntityInfo } from '../../../projects/core/server/remult-admin'
import remultAdminHtml from '../../../projects/core/server/remult-admin-html'
import { describe, expect, it } from 'vitest'
import { Entity, Fields, Relations, repo } from '../../core'
import { Remult } from '../../core/src/context'
import { InputTypes } from '../../core/inputTypes.js'
import { createId } from '@paralleldrive/cuid2'

describe('remult-admin', () => {
  it('should get entities', async () => {
    @Entity('accounts')
    class Account {
      @Fields.id()
      id!: string
      @Fields.string()
      name!: string
      @Fields.string({ includeInApi: false })
      password!: string
      @Fields.boolean()
      isBankrupt!: boolean
      @Relations.toMany(() => User)
      users!: User[]
    }

    @Entity('users')
    class User {
      @Fields.autoIncrement()
      id!: string
      @Fields.string()
      name!: string
      @Fields.date()
      bday!: Date
      @Fields.number({ sqlExpression: () => '7' })
      age!: number
      @Fields.number({ allowApiUpdate: false, sqlExpression: () => '11' })
      age2!: number
      @Fields.json()
      metadata!: []
      @Fields.json({ valueType: Array })
      metadata2!: []
      @Relations.toOne(() => Account)
      account!: Account
      @Relations.toOne(() => Account, { field: 'account' })
      account2!: Account
      @Relations.toOne(() => Account, {
        findOptions: { where: { isBankrupt: true } },
      })
      accountBankrupted!: Account
      @Fields.date({ allowNull: true })
      favDate: Date | null = null
    }

    class UserExtra extends User {
      @Fields.string()
      email2!: string
    }

    const res = buildEntityInfo({
      entities: [UserExtra, User, Account],
      remult: new Remult(),
    })

    expect(res).toMatchInlineSnapshot(`
      [
        {
          "caption": "Users",
          "defaultOrderBy": {
            "id": "asc",
          },
          "editMode": "inline",
          "editModeLocked": false,
          "fields": [
            {
              "allowNull": false,
              "caption": "Id",
              "inputType": "number",
              "key": "id",
              "readOnly": true,
              "relationToOne": undefined,
              "type": "number",
              "valFieldKey": "id",
              "values": undefined,
            },
            {
              "allowNull": false,
              "caption": "Name",
              "inputType": undefined,
              "key": "name",
              "readOnly": false,
              "relationToOne": undefined,
              "type": "string",
              "valFieldKey": "name",
              "values": undefined,
            },
            {
              "allowNull": true,
              "caption": "Bday",
              "inputType": undefined,
              "key": "bday",
              "readOnly": false,
              "relationToOne": undefined,
              "type": "date",
              "valFieldKey": "bday",
              "values": undefined,
            },
            {
              "allowNull": false,
              "caption": "Age",
              "inputType": "number",
              "key": "age",
              "readOnly": false,
              "relationToOne": undefined,
              "type": "number",
              "valFieldKey": "age",
              "values": undefined,
            },
            {
              "allowNull": false,
              "caption": "Age2",
              "inputType": "number",
              "key": "age2",
              "readOnly": true,
              "relationToOne": undefined,
              "type": "number",
              "valFieldKey": "age2",
              "values": undefined,
            },
            {
              "allowNull": true,
              "caption": "Metadata",
              "inputType": "json",
              "key": "metadata",
              "readOnly": false,
              "relationToOne": undefined,
              "type": "json",
              "valFieldKey": "metadata",
              "values": undefined,
            },
            {
              "allowNull": true,
              "caption": "Metadata2",
              "inputType": "json",
              "key": "metadata2",
              "readOnly": false,
              "relationToOne": undefined,
              "type": "json",
              "valFieldKey": "metadata2",
              "values": undefined,
            },
            {
              "allowNull": false,
              "caption": "Account",
              "inputType": "",
              "key": "account",
              "readOnly": false,
              "relationToOne": {
                "allowNull": false,
                "captionField": "name",
                "compoundIdField": undefined,
                "entityKey": "accounts",
                "fields": {
                  "id": "account",
                },
                "idField": "id",
                "where": undefined,
              },
              "type": "string",
              "valFieldKey": "account",
              "values": undefined,
            },
            {
              "allowNull": false,
              "caption": "Account2",
              "inputType": "text",
              "key": "account2",
              "readOnly": false,
              "relationToOne": {
                "allowNull": false,
                "captionField": "name",
                "compoundIdField": undefined,
                "entityKey": "accounts",
                "fields": {
                  "id": "account",
                },
                "idField": "id",
                "where": undefined,
              },
              "type": "string",
              "valFieldKey": "account",
              "values": undefined,
            },
            {
              "allowNull": false,
              "caption": "Account Bankrupted",
              "inputType": "text",
              "key": "accountBankrupted",
              "readOnly": false,
              "relationToOne": {
                "allowNull": false,
                "captionField": "name",
                "compoundIdField": undefined,
                "entityKey": "accounts",
                "fields": undefined,
                "idField": "id",
                "where": {
                  "isBankrupt": true,
                },
              },
              "type": "string",
              "valFieldKey": "accountBankrupted",
              "values": undefined,
            },
            {
              "allowNull": true,
              "caption": "Fav Date",
              "inputType": undefined,
              "key": "favDate",
              "readOnly": false,
              "relationToOne": undefined,
              "type": "date",
              "valFieldKey": "favDate",
              "values": undefined,
            },
            {
              "allowNull": false,
              "caption": "eMail2",
              "inputType": undefined,
              "key": "email2",
              "readOnly": false,
              "relationToOne": undefined,
              "type": "string",
              "valFieldKey": "email2",
              "values": undefined,
            },
          ],
          "hidden": false,
          "ids": {
            "id": true,
          },
          "key": "users",
          "permissions": {
            "delete": false,
            "insert": false,
            "update": false,
          },
          "relations": [],
          "superKey": "users",
        },
        {
          "caption": "Users*",
          "defaultOrderBy": {
            "id": "asc",
          },
          "editMode": "inline",
          "editModeLocked": false,
          "fields": [
            {
              "allowNull": false,
              "caption": "Id",
              "inputType": "number",
              "key": "id",
              "readOnly": true,
              "relationToOne": undefined,
              "type": "number",
              "valFieldKey": "id",
              "values": undefined,
            },
            {
              "allowNull": false,
              "caption": "Name",
              "inputType": undefined,
              "key": "name",
              "readOnly": false,
              "relationToOne": undefined,
              "type": "string",
              "valFieldKey": "name",
              "values": undefined,
            },
            {
              "allowNull": true,
              "caption": "Bday",
              "inputType": undefined,
              "key": "bday",
              "readOnly": false,
              "relationToOne": undefined,
              "type": "date",
              "valFieldKey": "bday",
              "values": undefined,
            },
            {
              "allowNull": false,
              "caption": "Age",
              "inputType": "number",
              "key": "age",
              "readOnly": false,
              "relationToOne": undefined,
              "type": "number",
              "valFieldKey": "age",
              "values": undefined,
            },
            {
              "allowNull": false,
              "caption": "Age2",
              "inputType": "number",
              "key": "age2",
              "readOnly": true,
              "relationToOne": undefined,
              "type": "number",
              "valFieldKey": "age2",
              "values": undefined,
            },
            {
              "allowNull": true,
              "caption": "Metadata",
              "inputType": "json",
              "key": "metadata",
              "readOnly": false,
              "relationToOne": undefined,
              "type": "json",
              "valFieldKey": "metadata",
              "values": undefined,
            },
            {
              "allowNull": true,
              "caption": "Metadata2",
              "inputType": "json",
              "key": "metadata2",
              "readOnly": false,
              "relationToOne": undefined,
              "type": "json",
              "valFieldKey": "metadata2",
              "values": undefined,
            },
            {
              "allowNull": false,
              "caption": "Account",
              "inputType": "",
              "key": "account",
              "readOnly": false,
              "relationToOne": {
                "allowNull": false,
                "captionField": "name",
                "compoundIdField": undefined,
                "entityKey": "accounts",
                "fields": {
                  "id": "account",
                },
                "idField": "id",
                "where": undefined,
              },
              "type": "string",
              "valFieldKey": "account",
              "values": undefined,
            },
            {
              "allowNull": false,
              "caption": "Account2",
              "inputType": "text",
              "key": "account2",
              "readOnly": false,
              "relationToOne": {
                "allowNull": false,
                "captionField": "name",
                "compoundIdField": undefined,
                "entityKey": "accounts",
                "fields": {
                  "id": "account",
                },
                "idField": "id",
                "where": undefined,
              },
              "type": "string",
              "valFieldKey": "account",
              "values": undefined,
            },
            {
              "allowNull": false,
              "caption": "Account Bankrupted",
              "inputType": "text",
              "key": "accountBankrupted",
              "readOnly": false,
              "relationToOne": {
                "allowNull": false,
                "captionField": "name",
                "compoundIdField": undefined,
                "entityKey": "accounts",
                "fields": undefined,
                "idField": "id",
                "where": {
                  "isBankrupt": true,
                },
              },
              "type": "string",
              "valFieldKey": "accountBankrupted",
              "values": undefined,
            },
            {
              "allowNull": true,
              "caption": "Fav Date",
              "inputType": undefined,
              "key": "favDate",
              "readOnly": false,
              "relationToOne": undefined,
              "type": "date",
              "valFieldKey": "favDate",
              "values": undefined,
            },
          ],
          "hidden": false,
          "ids": {
            "id": true,
          },
          "key": "users",
          "permissions": {
            "delete": false,
            "insert": false,
            "update": false,
          },
          "relations": [],
          "superKey": "users_ext_1",
        },
        {
          "caption": "Accounts",
          "defaultOrderBy": {
            "id": "asc",
          },
          "editMode": "inline",
          "editModeLocked": false,
          "fields": [
            {
              "allowNull": false,
              "caption": "Id",
              "inputType": undefined,
              "key": "id",
              "readOnly": true,
              "relationToOne": undefined,
              "type": "string",
              "valFieldKey": "id",
              "values": undefined,
            },
            {
              "allowNull": false,
              "caption": "Name",
              "inputType": undefined,
              "key": "name",
              "readOnly": false,
              "relationToOne": undefined,
              "type": "string",
              "valFieldKey": "name",
              "values": undefined,
            },
            {
              "allowNull": false,
              "caption": "Is Bankrupt",
              "inputType": "checkbox",
              "key": "isBankrupt",
              "readOnly": false,
              "relationToOne": undefined,
              "type": "boolean",
              "valFieldKey": "isBankrupt",
              "values": undefined,
            },
          ],
          "hidden": false,
          "ids": {
            "id": true,
          },
          "key": "accounts",
          "permissions": {
            "delete": false,
            "insert": false,
            "update": false,
          },
          "relations": [
            {
              "caption": "Users",
              "compoundIdField": undefined,
              "entityKey": "users",
              "fields": {
                "account": "id",
              },
              "key": "users",
              "where": undefined,
            },
          ],
          "superKey": "accounts",
        },
      ]
    `)
  })

  it('should get html', async () => {
    @Entity('users')
    class User {
      @Fields.autoIncrement()
      id!: string
    }

    const res = remultAdminHtml({
      rootPath: '/api',
      head: '<title>Test Admin</title>',
      requireAuthToken: false,
      disableLiveQuery: false,
    })

    expect(res).includes('html')

    expect(res).not.includes('<!--PLACE_HERE_HEAD-->')
    expect(res).includes('<title>Test Admin</title>')

    expect(res).not.includes('<!--PLACE_HERE_BODY-->')
    expect(res).includes('window.optionsFromServer = ')
  })

  it('should not have LiveQuery', async () => {
    @Entity('users')
    class User {
      @Fields.autoIncrement()
      id!: string
    }

    const res = remultAdminHtml({
      rootPath: '/api',
      head: '<title>Test Admin</title>',
      requireAuthToken: false,
      disableLiveQuery: true,
    })

    expect(res).includes('html')

    expect(res).includes('"disableLiveQuery":true')
  })

  it('metadata.apiInsertAllowed() follows allowApiInsert', () => {
    @Entity('ins1', { allowApiInsert: true })
    class A {
      @Fields.id()
      id!: string
    }
    @Entity('ins2', { allowApiInsert: false, allowApiUpdate: true })
    class B {
      @Fields.id()
      id!: string
    }
    const remult = new Remult()
    expect(remult.repo(A).metadata.apiInsertAllowed()).toBe(true)
    expect(remult.repo(B).metadata.apiInsertAllowed()).toBe(false)
  })

  describe('permissions', () => {
    const perms = (entity: any, remult = new Remult()) =>
      buildEntityInfo({ entities: [entity], remult })[0].permissions

    it('allowApiCrud true', () => {
      @Entity('p1', { allowApiCrud: true })
      class E {
        @Fields.id()
        id!: string
      }
      expect(perms(E)).toEqual({ insert: true, update: true, delete: true })
    })

    it('allowApiCrud role', () => {
      @Entity('p2', { allowApiCrud: 'admin' })
      class E {
        @Fields.id()
        id!: string
      }
      const remult = new Remult()
      // read requires 'admin' too, so entity is hidden without the role
      remult.user = { id: 'u', name: 'u', roles: ['admin'] }
      expect(perms(E, remult)).toEqual({
        insert: true,
        update: true,
        delete: true,
      })
      const other = new Remult()
      other.user = { id: 'u', name: 'u', roles: [] }
      expect(buildEntityInfo({ entities: [E], remult: other })).toHaveLength(0)
    })

    it('allowApiInsert role, read open', () => {
      @Entity('p2b', { allowApiRead: true, allowApiInsert: 'admin' })
      class E {
        @Fields.id()
        id!: string
      }
      expect(perms(E)).toEqual({
        insert: false,
        update: false,
        delete: false,
      })
    })

    it('allowApiCrud function', () => {
      @Entity('p3', { allowApiCrud: () => false })
      class E {
        @Fields.id()
        id!: string
      }
      expect(buildEntityInfo({ entities: [E], remult: new Remult() })).toEqual(
        [],
      )
    })

    it('allowApiCrud function with read open', () => {
      @Entity('p3b', { allowApiRead: true, allowApiUpdate: () => false })
      class E {
        @Fields.id()
        id!: string
      }
      expect(perms(E)).toEqual({
        insert: false,
        update: 'row',
        delete: false,
      })
    })

    it('allowApiInsert function returning true is insert true', () => {
      @Entity('p3c', { allowApiRead: true, allowApiInsert: () => true })
      class E {
        @Fields.id()
        id!: string
      }
      expect(perms(E).insert).toBe(true)
    })

    it('array rule containing a function is row level', () => {
      @Entity('p3d', {
        allowApiRead: true,
        allowApiUpdate: ['nobody', () => false],
        allowApiDelete: ['nobody', () => false],
      })
      class E {
        @Fields.id()
        id!: string
      }
      const p = perms(E)
      expect(p.update).toBe('row')
      expect(p.delete).toBe('row')
    })

    it('row level rules', () => {
      const remult = new Remult()
      @Entity('p4', {
        allowApiRead: true,
        allowApiUpdate: (t: any) => t.owner === remult.user?.id,
        allowApiInsert: (t: any) => t.x > 1,
      })
      class E {
        @Fields.id()
        id!: string
        @Fields.string()
        owner = ''
        @Fields.number()
        x = 0
      }
      expect(perms(E, remult)).toEqual({
        insert: 'row',
        update: 'row',
        delete: false,
      })
    })

    it('no rules', () => {
      @Entity('p5', { allowApiRead: true })
      class E {
        @Fields.id()
        id!: string
      }
      expect(perms(E)).toEqual({
        insert: false,
        update: false,
        delete: false,
      })
    })

    it('allowApiCrud function is row level for update and delete', () => {
      @Entity('p6', { allowApiRead: true, allowApiCrud: () => false })
      class E {
        @Fields.id()
        id!: string
      }
      expect(perms(E)).toEqual({
        insert: false,
        update: 'row',
        delete: 'row',
      })
    })
  })

  describe('entities hook', () => {
    @Entity('eh_users', { allowApiCrud: true })
    class U {
      @Fields.id()
      id!: string
    }
    @Entity('eh_tasks', { allowApiCrud: true })
    class T {
      @Fields.id()
      id!: string
    }
    const info = (entityConfig?: any, remult = new Remult()) =>
      buildEntityInfo({ entities: [U, T], remult, entityConfig })

    it('defaults without hook', () => {
      for (const e of info()) {
        expect(e).toMatchObject({
          hidden: false,
          editMode: 'inline',
          editModeLocked: false,
        })
      }
    })

    it('false hides but keeps the entity', () => {
      const res = info((e: any) => e.key !== 'eh_users')
      expect(res.map((e) => e.key)).toEqual(['eh_users', 'eh_tasks'])
      expect(res[0].hidden).toBe(true)
      expect(res[1].hidden).toBe(false)
    })

    it('object overrides', () => {
      const res = info(() => ({ editMode: 'drawer', lockEditMode: true }))
      expect(res[0]).toMatchObject({
        hidden: false,
        editMode: 'drawer',
        editModeLocked: true,
      })
    })

    it('receives the request remult', () => {
      const remult = new Remult()
      remult.user = { id: 'u', name: 'u', roles: ['admin'] }
      const hook = (_e: any, r: Remult) => r.isAllowed('admin')
      expect(info(hook, remult).every((e) => !e.hidden)).toBe(true)
      expect(info(hook).every((e) => e.hidden)).toBe(true)
    })
  })

  it('should correctly set valueType for json fields', () => {
    @Entity('test-json-types')
    class JsonTypeTest {
      @Fields.id({ idFactory: () => createId() })
      id!: string

      @Fields.json()
      metadata!: []

      @Fields.json({ valueType: Array })
      metadata2!: []
    }

    const remult = new Remult()
    const entityInfo = buildEntityInfo({
      entities: [JsonTypeTest],
      remult: remult,
    })

    // Check the actual underlying valueType in the repository
    const repo = remult.repo(JsonTypeTest)
    expect(repo.fields.metadata.valueType).toBe(undefined)
    expect(repo.fields.metadata.inputType).toBe(InputTypes.json)
    expect(repo.fields.metadata2.valueType).toBe(Array)
    expect(repo.fields.metadata2.inputType).toBe(InputTypes.json)
  })
})
