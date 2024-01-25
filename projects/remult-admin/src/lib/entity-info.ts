import { ClassType } from 'remult'
import { RelationFieldInfo, RelationFields } from 'remult/internals'

export interface EntityUIInfo {
  key: string
  caption: string
  fields: FieldUIInfo[]
  ids: Record<string, true>
  relations: EntityRelationToManyInfo[]
}
export interface EntityRelationToManyInfo extends RelationFields {
  entityKey: string
  where?: any
}

export interface FieldUIInfo {
  key: string
  valFieldKey: string
  caption: string
  type: 'json' | 'string' | 'number' | 'boolean'
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
}
export interface DisplayOptions {
  baseUrl?: string
}
