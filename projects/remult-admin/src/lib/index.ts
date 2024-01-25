import {
  ClassType,
  Remult,
  remult,
  repo,
  Filter,
  CompoundIdField,
} from 'remult'
import { getRelationFieldInfo } from 'remult/internals'

export default function remultAdminHtml(options: AdminOptions) {
  let optionsFromServer = { ...options }
  //@ts-ignore
  delete optionsFromServer.entities
  return getHtml().replace(
    '<!--PLACE_HERE-->',
    `<script >const entities = ${JSON.stringify(buildEntityInfo(options))}
    const optionsFromServer = ${JSON.stringify(optionsFromServer)}
    </script>`
  )
}

export function buildEntityInfo(options: AdminOptions) {
  const entities: EntityUIInfo[] = []
  for (const metadata of options.entities.map((e) => remult.repo(e).metadata)) {
    let fields: FieldUIInfo[] = []
    let relations: EntityRelationToManyInfo[] = []

    let ids: Record<string, true> = {}
    if (metadata.idMetadata.field instanceof CompoundIdField) {
      for (const field of metadata.idMetadata.field.fields) {
        ids[field.key] = true
      }
    } else ids[metadata.idMetadata.field.key] = true

    for (const x of metadata.fields.toArray()) {
      if (!x.includedInApi(undefined)) continue
      let relation: FieldRelationToOneInfo | undefined
      let valFieldKey = x.key
      const info = getRelationFieldInfo(x)
      if (info) {
        const relInfo = info.getFields()
        const relRepo = repo(info.toEntity)
        const where =
          typeof info.options.findOptions === 'object' &&
          info.options.findOptions.where
            ? Filter.entityFilterToJson(
                relRepo.metadata,
                info.options.findOptions.where
              )
            : undefined
        const idField = relRepo.metadata.idMetadata.field.key
        if (info.type === 'reference' || info.type === 'toOne') {
          if (info.type == 'toOne') {
            for (const key in relInfo.fields) {
              if (Object.prototype.hasOwnProperty.call(relInfo.fields, key)) {
                const element = relInfo.fields[key]
                valFieldKey = element
              }
            }
          }
          relation = {
            ...relInfo,
            where,
            entityKey: relRepo.metadata.key,
            idField,
            captionField: relRepo.metadata.fields
              .toArray()
              .find((x) => x.key != idField && x.valueType == String)?.key!,
          }
        } else if (info.type === 'toMany') {
          relations.push({
            ...relInfo,
            where,
            entityKey: relRepo.metadata.key,
          })
          continue
        }
      }
      fields.push({
        key: x.key,
        valFieldKey,
        caption: x.caption,
        relationToOne: relation,
        type:
          x.valueConverter.fieldTypeInDb == 'json'
            ? 'json'
            : x.valueType === Number
            ? 'number'
            : x.valueType === Boolean
            ? 'boolean'
            : 'string',
      })
    }
    entities.push({
      key: metadata.key,
      caption: metadata.caption,
      ids,
      fields,
      relations,
    })
  }
  return entities
}

/**FROM */
import fs from 'fs'
import {
  AdminOptions,
  EntityRelationToManyInfo,
  EntityUIInfo,
  FieldRelationToOneInfo,
  FieldUIInfo,
} from './entity-info'
function getHtml() {
  return fs.readFileSync('tmp/index.html', 'utf8')
}
/**TO */
