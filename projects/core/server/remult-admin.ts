import {
  type RelationFields,
  getRelationFieldInfo,
} from '../src/remult3/relationInfoMember.js'
import { Filter } from '../src/filter/filter-interfaces.js'
import type { ClassType } from '../classType.js'
import type { Remult } from '../src/context.js'
import { getHtml } from './get-remult-admin-html.js'
import { getValueList } from '../src/remult3/RepositoryImplementation.js'

export interface EntityUIInfo {
  key: string
  caption: string
  fields: FieldUIInfo[]
  ids: Record<string, true>
  relations: EntityRelationToManyInfo[]
  color?: string
}
export interface EntityRelationToManyInfo extends RelationFields {
  entityKey: string
  where?: any
}

export type FieldUIInfoType = 'json' | 'string' | 'number' | 'date' | 'boolean'

export interface FieldUIInfo {
  key: string
  readOnly: boolean
  values: { id: string | number; caption: string }[]
  valFieldKey: string
  caption: string
  type: FieldUIInfoType
  relationToOne?: FieldRelationToOneInfo
}
export interface FieldRelationToOneInfo extends RelationFields {
  entityKey: string
  idField: string
  captionField: string
  where?: any
}
export interface AdminOptions extends DisplayOptions {
  entities: ClassType<any>[]
  remult: Remult
}
export interface DisplayOptions {
  baseUrl?: string
}

export default function remultAdminHtml(options: AdminOptions) {
  let optionsFromServer = { ...options }
  //@ts-ignore
  delete optionsFromServer.entities
  delete optionsFromServer.remult
  return getHtml().replace(
    '<!--PLACE_HERE-->',
    `<script >const entities = ${JSON.stringify(buildEntityInfo(options))}
    const optionsFromServer = ${JSON.stringify(optionsFromServer)}
    </script>`,
  )
}

export function buildEntityInfo(options: AdminOptions) {
  const entities: EntityUIInfo[] = []
  for (const metadata of options.entities.map(
    (e) => options.remult.repo(e).metadata,
  )) {
    let fields: FieldUIInfo[] = []
    let relations: EntityRelationToManyInfo[] = []

    let ids: Record<string, true> = {}
    for (const f of metadata.idMetadata.fields) {
      ids[f.key] = true
    }

    for (const x of metadata.fields.toArray()) {
      if (!x.includedInApi(undefined)) continue
      let relation: FieldRelationToOneInfo | undefined
      let valFieldKey = x.key
      const info = getRelationFieldInfo(x)
      if (info) {
        const relInfo = info.getFields()
        const relRepo = options.remult.repo(info.toEntity)
        const where =
          typeof info.options.findOptions === 'object' &&
          info.options.findOptions.where
            ? Filter.entityFilterToJson(
                relRepo.metadata,
                info.options.findOptions.where,
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
        readOnly: x.dbReadOnly || !x.apiUpdateAllowed(),
        values: getValueList(x),
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
            : x.valueType === Date
            ? 'date'
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
