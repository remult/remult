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
        @Fields.id({ idFactory: () => '123' })
        id = ''
      }
      const repoIdTest = await createEntity(idTest)
      const res = await repoIdTest.insert({})
      expect(res.id).toBe('123')
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
    it('default id factory should have 5 parts (uuid)', async () => {
      Fields.defaultIdOptions.idFactory = () => 'hello'

      @Entity('idTest', { allowApiCrud: true })
      class idTest {
        @Fields.id()
        id = ''
      }
      const repoIdTest = await createEntity(idTest)
      const res = await repoIdTest.insert({})
      expect(res.id).toBe('hello')
    })

    it('default id factory should have 5 parts (uuid)', async () => {
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
    })
  })
}
