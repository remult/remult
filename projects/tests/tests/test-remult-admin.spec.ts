import remultAdminHtml, {
  buildEntityInfo,
} from '../../../projects/core/server/remult-admin'
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
              "allowNull": false,
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
              "allowNull": false,
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
              "allowNull": false,
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
          "ids": {
            "id": true,
          },
          "key": "users",
          "relations": [],
          "superKey": "users",
        },
        {
          "caption": "Users*",
          "defaultOrderBy": {
            "id": "asc",
          },
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
              "allowNull": false,
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
              "allowNull": false,
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
              "allowNull": false,
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
          "ids": {
            "id": true,
          },
          "key": "users",
          "relations": [],
          "superKey": "users_ext_1",
        },
        {
          "caption": "Accounts",
          "defaultOrderBy": {
            "id": "asc",
          },
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
          "ids": {
            "id": true,
          },
          "key": "accounts",
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
