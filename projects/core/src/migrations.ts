import { Entity, Fields, IdEntity, remult, repo } from '../index.js'
@Entity(undefined!, {
  dbName: 'versionInfo',
})
class VersionInfo extends IdEntity {
  @Fields.number()
  version: number = 0
}
let checkedVersionTableExistence = false
async function step(stepNumber: number, stepAction: () => Promise<void>) {
  if (!checkedVersionTableExistence) {
    checkedVersionTableExistence = true
    if (remult.dataProvider.ensureSchema) {
      await remult.dataProvider.ensureSchema([repo(VersionInfo).metadata])
    }
  }
  let v = await remult.repo(VersionInfo).findFirst()
  if (!v) {
    v = remult.repo(VersionInfo).create()
    v.version = 0
  }
  if (v.version <= stepNumber - 1) {
    await stepAction()
    v.version = stepNumber
    await v.save()
  }
}
export type MigrationSteps = Record<
  number,
  (executeSql: (sql: string) => Promise<any>) => Promise<void>
>

//[ ] - consider migrations context key
