import {
  type RelationFields,
  getRelationFieldInfo,
} from '../src/remult3/relationInfoMember.js'
import { Filter } from '../src/filter/filter-interfaces.js'
import type { ClassType } from '../classType.js'
import type { AllowedForInstance, Remult } from '../src/context.js'
import {
  getValueList,
  rowIndependentRules,
} from '../src/remult3/RepositoryImplementation.js'
import type { EntityFilter, EntityMetadata } from '../src/remult3/remult3.js'
import type { FieldMetadata } from '../src/column-interfaces.js'
import { InputTypes } from '../inputTypes.js'

export type AdminPermission = boolean | 'row'
/** The kind of rule behind a permission, never its content (no role names). */
export type AdminRule = 'bool' | 'role' | 'roles' | 'function'
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
  /** The API narrows the rows this user sees (see resolveAdminPrefilters). */
  apiPrefilter: boolean
  permissions: {
    insert: AdminPermission
    update: AdminPermission
    delete: AdminPermission
  }
  rules: {
    insert: AdminRule
    update: AdminRule
    delete: AdminRule
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
          readOnly: readOnlyOf(x),
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
        apiPrefilter: metadata.options.apiPrefilter !== undefined,
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
        rules: {
          insert: adminRule(metadata.options.allowApiInsert),
          update: adminRule(metadata.options.allowApiUpdate),
          delete: adminRule(metadata.options.allowApiDelete),
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

/** Keeps `apiPrefilter` only where it narrows rows for this user: an admin whose prefilter is `{}` sees everything. */
export async function resolveAdminPrefilters(
  info: EntityUIInfo[],
  entities: ClassType<any>[],
  remult: Remult,
): Promise<EntityUIInfo[]> {
  for (const e of info) {
    if (!e.apiPrefilter) continue
    const entity = findAdminEntity(entities, remult, e.superKey)
    if (!entity) continue
    const metadata = remult.repo(entity).metadata
    const prefilter = metadata.options.apiPrefilter
    try {
      const where =
        typeof prefilter === 'function' ? await prefilter() : prefilter
      e.apiPrefilter =
        Object.keys(Filter.entityFilterToJson(metadata, where ?? {}) ?? {})
          .length > 0
    } catch {
      // can't tell: say it may narrow
      e.apiPrefilter = true
    }
  }
  return info
}

export type RelationsToOneValues = Record<string, Map<any, any>>

const hasFn = (rule: AllowedForInstance<any>): boolean =>
  Array.isArray(rule)
    ? rule.some(hasFn)
    : typeof rule === 'function' && !rowIndependentRules.has(rule)

function readOnlyOf(field: FieldMetadata) {
  try {
    return !field.apiUpdateAllowed()
  } catch {
    // the rule needs the row; the server still enforces it per row
    return true
  }
}

export function adminRule(
  rule: AllowedForInstance<any> | undefined,
): AdminRule {
  if (Array.isArray(rule)) {
    const kinds = rule.map(adminRule)
    if (kinds.includes('function')) return 'function'
    return kinds.includes('role') ? 'roles' : 'bool'
  }
  if (typeof rule === 'function') return 'function'
  return typeof rule === 'string' ? 'role' : 'bool'
}

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
