import {
  Entity,
  type DataProvider,
  type EntityMetadata,
  type FieldMetadata,
  IdEntity,
  Fields,
  remult,
  Repository,
} from '../index.js'

export type MigrationSteps = Record<
  number,
  (executeSql: (sql: string) => Promise<any>) => Promise<void>
>

export interface MigrationBuilder {
  createTable(
    meta: EntityMetadata,
    builder: MigrationStepBuilder,
  ): Promise<void>
  createColumn(
    meta: EntityMetadata,
    field: FieldMetadata,
    builder: MigrationStepBuilder,
  ): Promise<void>
}

export interface MigrationStepBuilder {
  addSql(sql: string): void
  addComment(comment: string): void
  addTypescriptCode(code: string): void
}

export class MigrationsManager {
  constructor(
    private options: {
      steps: MigrationSteps
      dataProvider?: Promise<DataProvider> | DataProvider
      executeSql: (sql: string) => Promise<any>
    },
  ) {}
  _initValue: {
    getVersion(): number
    setVersion(version: number): Promise<void>
  }
  private async init(): Promise<typeof this._initValue> {
    if (this._initValue) return this._initValue
    const dataProvider = this.options.dataProvider
      ? await this.options.dataProvider
      : remult.dataProvider
    @Entity(undefined!, {
      dbName: 'versionInfo',
    })
    class VersionInfo extends IdEntity {
      @Fields.number()
      version = -1
    }
    const repo = remult.repo(VersionInfo, dataProvider)

    if (dataProvider.ensureSchema) {
      await dataProvider.ensureSchema([repo.metadata])
    }
    let v = await repo.findFirst()
    if (!v) {
      v = remult.repo(VersionInfo, dataProvider).create()
      v.version = -1
    }
    this._initValue = {
      getVersion: () => v.version,
      setVersion: async (version: number) => {
        v.version = version
        await v.save()
      },
    }
    return this._initValue
  }

  async setCurrentVersion(version: number) {
    await (await this.init()).setVersion(version)
  }
  async runMigrations() {
    let v = await this.init()

    const steps = Object.entries(this.options.steps).sort(
      ([a], [b]) => parseInt(a) - parseInt(b),
    )

    for (const [stepText, action] of steps) {
      const step = parseInt(stepText)
      if (step < 0)
        throw new Error('Migration step number must be a non-negative integer')
      if (v.getVersion() >= step) continue
      console.info('Executing migration step', step)
      await action(async (sql) => {
        await this.options.executeSql(sql)
      })

      await v.setVersion(step)
    }
  }
}
