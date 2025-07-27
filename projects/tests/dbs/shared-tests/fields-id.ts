import { describe, expect, it } from 'vitest'
import { Entity, Fields } from '../../../core'
import type { DbTestProps } from './db-tests-props'
import { createId } from '@paralleldrive/cuid2'
import { DbTestOptions } from './db-tests.js'

export function fieldsIdTests(
  { createEntity }: DbTestProps,
  options?: DbTestOptions,
) {
  describe('local idFactory', () => {
    it('default id factory should have 5 parts (uuid)', async () => {
      @Entity('idTest', { allowApiCrud: true })
      class idTest {
        @Fields.id()
        id = ''
      }
      const repoIdTest = await createEntity(idTest)
      const res = await repoIdTest.insert({})
      expect(res.id.split('-').length).toBe(5)
    })

    it('fixed value id, should be the same', async () => {
      const val = '628729d4-2a33-4ae9-8219-8aab0af9d440'
      @Entity('idTest', { allowApiCrud: true })
      class idTest {
        @Fields.id({ idFactory: () => val })
        id = ''
      }
      const repoIdTest = await createEntity(idTest)
      const res = await repoIdTest.insert({})
      expect(res.id).toBe(val)
    })

    it('cuid', async () => {
      @Entity('idTest', { allowApiCrud: true })
      class idTest {
        @Fields.id({ idFactory: () => createId() })
        id = ''
      }
      const repoIdTest = await createEntity(idTest)
      const res = await repoIdTest.insert({})
      expect(res.id.includes('-')).toBe(false)
      expect(res.id.length).toBe(24)
    })

    it('allowNull dont generate id', async () => {
      @Entity('idTest', { allowApiCrud: true })
      class idTest {
        @Fields.id({ allowNull: true })
        id?: string | null = null
      }
      const repoIdTest = await createEntity(idTest)
      const res = repoIdTest.create({})
      expect(res.id).toBe(null)
    })
  })

  describe('global idFactory', () => {
    it('Fields.defaultIdOptions.idFactory', async () => {
      const old = Fields.defaultIdOptions.idFactory
      const val = '6f321686-b484-422b-8050-3fa10248caca'
      Fields.defaultIdOptions.idFactory = () => val

      @Entity('idTest', { allowApiCrud: true })
      class idTest {
        @Fields.id()
        id = ''
      }
      const repoIdTest = await createEntity(idTest)
      const res = await repoIdTest.insert({})
      expect(res.id).toBe(val)
      Fields.defaultIdOptions.idFactory = old
    })

    it('Fields.defaultIdOptions.fieldTypeInDb', async () => {
      const old = Fields.defaultIdOptions.fieldTypeInDb
      const val = options?.fieldTypeInDb || 'uuid'
      Fields.defaultIdOptions.fieldTypeInDb = val

      @Entity('idTest', { allowApiCrud: true })
      class idTest {
        @Fields.id()
        id = ''
      }
      const repoIdTest = await createEntity(idTest)
      expect(repoIdTest.metadata.fields.id.valueConverter.fieldTypeInDb).toBe(
        val,
      )
      Fields.defaultIdOptions.fieldTypeInDb = old
    })
  })
}
