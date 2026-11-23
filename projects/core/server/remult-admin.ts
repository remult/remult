import {
  type RelationFields,
  getRelationFieldInfo,
} from '../src/remult3/relationInfoMember.js'
import { Filter } from '../src/filter/filter-interfaces.js'
import type { ClassType } from '../classType.js'
import type { AllowedForInstance, Remult } from '../src/context.js'
import { getValueList } from '../src/remult3/RepositoryImplementation.js'
import type { EntityFilter, EntityMetadata } from '../src/remult3/remult3.js'
import { InputTypes } from '../inputTypes.js'

export type AdminPermission = boolean | 'row'
export type AdminEditMode = 'inline' | 'drawer'
export interface AdminEntityConfig {
  editMode?: AdminEditMode
  lockEditMode?: boolean
}

export interface EntityUIInfo {
  superKey: string
  key: string
  caption: string
  fields: FieldUIInfo[]
  ids: Record<string, true>
  relations: EntityRelationToManyInfo[]
  defaultOrderBy?: EntityFilter<any>
  color?: string
  hidden: boolean
  editMode: AdminEditMode
  editModeLocked: boolean
  permissions: {
    insert: AdminPermission
    update: AdminPermission
    delete: AdminPermission
  }
}
export interface EntityRelationToManyInfo extends RelationFields {
  key: string
  caption: string
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
  inputType: string
  allowNull: boolean
  relationToOne?: FieldRelationToOneInfo
}
export interface FieldRelationToOneInfo extends RelationFields {
  entityKey: string
  // TODO: remove in favor of fields ?
  idField: string
  captionField: string
  allowNull: boolean
  where?: any
}
export interface AdminEntitiesOptions {
  entities: ClassType<any>[]
  remult: Remult
  entityConfig?: (
    entity: EntityMetadata,
    remult: Remult,
  ) => boolean | AdminEntityConfig
}
export interface AdminDisplayOptions {
  rootPath: string
  head: string
  requireAuthToken: boolean
  disableLiveQuery: boolean
}

export function buildEntityInfo(options: AdminEntitiesOptions) {
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
      try {
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
            if (relRepo.metadata.apiReadAllowed) {
              relation = {
                ...relInfo,
                allowNull: x.allowNull,
                where,
                entityKey: relRepo.metadata.key,
                idField,
                captionField: relRepo.metadata.fields
                  .toArray()
                  .find((x) => x.key != idField && x.valueType == String)?.key!,
              }
            }
          } else if (info.type === 'toMany') {
            if (relRepo.metadata.apiReadAllowed) {
              relations.push({
                ...relInfo,
                where,
                entityKey: relRepo.metadata.key,
                key: x.key,
                caption: x.label,
              })
            }
            continue
          }
        }
        fields.push({
          key: x.key,
          readOnly: !x.apiUpdateAllowed(),
          values: getValueList(x),
          valFieldKey,
          caption: x.label,
          relationToOne: relation,
          inputType: x.inputType,
          allowNull: x.allowNull,
          type:
            x.inputType === InputTypes.json
              ? 'json'
              : x.valueType === Number
                ? 'number'
                : x.valueType === Boolean
                  ? 'boolean'
                  : x.valueType === Date
                    ? 'date'
                    : 'string',
        })
      } catch (error) {
        console.error(
          `[remult-admin] Error with ${metadata.key}.${x.key} field.`,
        )
        console.error(`[remult-admin]`, error)
      }
    }

    if (metadata.apiReadAllowed) {
      const nbOfEntities = entities.filter((e) => e.key === metadata.key).length
      const superKey = adminSuperKey(metadata.key, nbOfEntities)
      const caption = metadata.label + '*'.repeat(nbOfEntities)
      const config = options.entityConfig?.(metadata, options.remult) ?? true
      const custom = typeof config === 'object' ? config : undefined

      entities.push({
        superKey,
        key: metadata.key,
        caption,
        ids,
        fields,
        relations,
        defaultOrderBy: metadata.options.defaultOrderBy ?? { id: 'asc' },
        hidden: config === false,
        editMode: custom?.editMode ?? 'inline',
        editModeLocked: custom?.lockEditMode ?? false,
        permissions: {
          insert: resolveAdminPermission(
            options.remult,
            metadata.options.allowApiInsert,
            'insert',
          ),
          update: resolveAdminPermission(
            options.remult,
            metadata.options.allowApiUpdate,
            'update',
          ),
          delete: resolveAdminPermission(
            options.remult,
            metadata.options.allowApiDelete,
            'delete',
          ),
        },
      })
    }
  }

  return entities
}

/** First occurrence of a key is the key itself, later ones get `_ext_n`. */
function adminSuperKey(key: string, nbOfPrevious: number) {
  return nbOfPrevious > 0 ? key + '_ext_' + nbOfPrevious : key
}

function findAdminEntity(
  entities: ClassType<any>[],
  remult: Remult,
  superKey: string,
) {
  const seen: Record<string, number> = {}
  for (const entity of entities) {
    const metadata = remult.repo(entity).metadata
    if (!metadata.apiReadAllowed) continue
    const nb = seen[metadata.key] ?? 0
    seen[metadata.key] = nb + 1
    if (adminSuperKey(metadata.key, nb) === superKey) return entity
  }
}

export const ADMIN_ROW_PERMISSIONS_MAX_IDS = 200

/** Undefined when superKey is unknown. Ids not found (or hidden by apiPrefilter) are omitted. */
export async function getRowPermissions(o: {
  remult: Remult
  entities: ClassType<any>[]
  superKey: string
  ids: string[]
}): Promise<Record<string, { update: boolean; delete: boolean }> | undefined> {
  const entity = findAdminEntity(o.entities, o.remult, o.superKey)
  if (!entity) return undefined
  const repo = o.remult.repo(entity)
  const result: Record<string, { update: boolean; delete: boolean }> = {}
  if (o.ids.length === 0) return result

  // repo.find does not apply apiPrefilter, rows the API would not return must not be reported
  const prefilter = repo.metadata.options.apiPrefilter
  const where: EntityFilter<any>[] = [
    repo.metadata.idMetadata.getIdFilter(...o.ids),
  ]
  if (prefilter) {
    where.push(typeof prefilter === 'function' ? await prefilter() : prefilter)
  }
  for (const row of await repo.find({ where: { $and: where } })) {
    const ref = repo.getEntityRef(row)
    result[String(repo.metadata.idMetadata.getId(row))] = {
      update: ref.apiUpdateAllowed,
      delete: ref.apiDeleteAllowed,
    }
  }
  return result
}

export type RelationsToOneValues = Record<string, Map<any, any>>

const hasFn = (rule: AllowedForInstance<any>): boolean =>
  Array.isArray(rule) ? rule.some(hasFn) : typeof rule === 'function'

export function resolveAdminPermission(
  remult: Remult,
  rule: AllowedForInstance<any> | undefined,
  kind: 'insert' | 'update' | 'delete',
): AdminPermission {
  if (rule === undefined) return false
  if (!hasFn(rule)) return remult.isAllowedForInstance(undefined, rule) === true
  // Only insert can be probed without a row; a rule that needs one throws
  if (kind !== 'insert') return 'row'
  try {
    return remult.isAllowedForInstance(undefined, rule) === true
  } catch {
    // Rule dereferences the row, so it can only be decided per row
    return 'row'
  }
}
