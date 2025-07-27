import { describe, expect, it } from 'vitest'
import { Entity, EntityBase, Fields, repo } from '../../../core'
import { describeClass } from '../../../core/src/remult3/classDescribers'
import type { DbTestProps } from './db-tests-props'
import { createId } from '@paralleldrive/cuid2'

export function fieldsIdTests({ createEntity }: DbTestProps) {
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
      @Entity('idTest', { allowApiCrud: true })
      class idTest {
        @Fields.id({ idFactory: () => '628729d4-2a33-4ae9-8219-8aab0af9d440' })
        id = ''
      }
      const repoIdTest = await createEntity(idTest)
      const res = await repoIdTest.insert({})
      expect(res.id).toBe('628729d4-2a33-4ae9-8219-8aab0af9d440')
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
      Fields.defaultIdOptions.idFactory = () =>
        '6f321686-b484-422b-8050-3fa10248caca'

      @Entity('idTest', { allowApiCrud: true })
      class idTest {
        @Fields.id()
        id = ''
      }
      const repoIdTest = await createEntity(idTest)
      const res = await repoIdTest.insert({})
      expect(res.id).toBe('6f321686-b484-422b-8050-3fa10248caca')
      Fields.defaultIdOptions.idFactory = old
    })

    it('Fields.defaultIdOptions.fieldTypeInDb', async () => {
      const old = Fields.defaultIdOptions.fieldTypeInDb
      Fields.defaultIdOptions.fieldTypeInDb = 'uuid'

      @Entity('idTest', { allowApiCrud: true })
      class idTest {
        @Fields.id()
        id = ''
      }
      const repoIdTest = await createEntity(idTest)
      expect(repoIdTest.metadata.fields.id.valueConverter.fieldTypeInDb).toBe(
        'uuid',
      )
      Fields.defaultIdOptions.fieldTypeInDb = old
    })
  })
}
