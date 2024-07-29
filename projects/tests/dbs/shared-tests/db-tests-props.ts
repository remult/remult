import type { DataProvider, Remult, Repository } from '../../../core'
import type { ClassType } from '../../../core/classType'

export type DbTestProps = {
  getDb: () => DataProvider
  getRemult: () => Remult
  createEntity<entityType>(
    entity: ClassType<entityType>,
  ): Promise<Repository<entityType>>
}
