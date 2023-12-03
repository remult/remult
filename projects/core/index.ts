import type { ClassType } from './classType'

/*
 * Public API Surface of remult
 */
export {
  OmitEB,
  OmitFunctions,
  FieldsMetadata,
  FieldRef,
  IdFieldRef,
  FieldsRef,
  EntityMetadata,
  EntityOrderBy,
  EntityFilter,
  FindOptions,
  QueryResult,
  QueryOptions,
  Repository,
  FindFirstOptions,
  ComparisonValueFilter,
  ValueFilter,
  IdFilter,
  ContainsStringValueFilter,
  EntityRef,
  SortSegments,
  Paginator,
  LiveQuery,
  LiveQueryChangeInfo,
  Subscribable,
  RefSubscriber,
  RefSubscriberBase,
  RelationOptions,
  ObjectMembersOnly,
  MembersToInclude,
  RepositoryRelations,
  EntityIdFields,
  ClassFieldDecorator,
  ClassFieldDecoratorContextStub, //n1 consider removing in ts5
  LifecycleEvent,
} from './src/remult3/remult3'
export {
  EntityBase,
  ControllerBase,
  FieldType,
  getFields,
  ValueListFieldType,
  getValueList,
  ValueListFieldOptions,
  ValueListInfo,
  CaptionTransformer,
} from './src/remult3/RepositoryImplementation'
export { Entity } from './src/remult3/entity'
export { getEntityRef } from './src/remult3/getEntityRef'
export {
  Field,
  Fields,
  StringFieldOptions,
  Relations,
} from './src/remult3/Fields'
export { IdEntity } from './src/remult3/IdEntity'

export { describeClass } from './src/remult3/DecoratorReplacer'
export { EntityOptions } from './src/entity'
export {
  DataProvider,
  EntityDataProvider,
  EntityDataProviderFindOptions,
  ErrorInfo,
  RestDataProviderHttpProvider,
} from './src/data-interfaces' //V
export { SqlCommand, SqlImplementation, SqlResult } from './src/sql-command' //V
export {
  FieldMetadata,
  FieldOptions,
  FieldValidator,
  ValueConverter,
  ValueListItem, // reconsider, maybe it should go to remult angular as the abstraction ?
  ValueOrExpression,
} from './src/column-interfaces' // revisit input type
export { RestDataProvider } from './src/data-providers/rest-data-provider' //V
export { InMemoryDataProvider } from './src/data-providers/in-memory-database' //V
export { ArrayEntityDataProvider } from './src/data-providers/array-entity-data-provider' //V
export { WebSqlDataProvider } from './src/data-providers/web-sql-data-provider' //V
export { SqlDatabase } from './src/data-providers/sql-database' //V
export {
  CustomSqlFilterObject,
  CustomSqlFilterBuilder,
  dbNamesOf,
} from './src/filter/filter-consumer-bridge-to-sql-request'

export {
  JsonDataProvider,
  JsonEntityStorage,
} from './src/data-providers/json-data-provider' //V

//export * from './src/data-api'; //reconsider if to make internal
export {
  Controller,
  BackendMethodOptions,
  BackendMethod,
  ProgressListener,
} from './src/server-action'

export {
  Allowed,
  Allow,
  Remult,
  RemultContext,
  ApiClient,
  isBackend,
  AllowedForInstance,
  EventDispatcher,
  EventSource,
  UserInfo,
} from './src/context'
export { ExternalHttpProvider } from './src/buildRestDataProvider'
export { SortSegment, Sort } from './src/sort'
export { CompoundIdField } from './src/CompoundIdField'
export { Filter } from './src/filter/filter-interfaces'
export { UrlBuilder } from './urlBuilder'
export { Validators } from './src/validators'

export { ValueConverters } from './src/valueConverters'
export { remult } from './src/remult-proxy'
import { remult } from './src/remult-proxy'

//export { getId } from './src/remult3/getId';

export {
  SubscriptionServer,
  LiveQueryStorage,
  StoredQuery,
  InMemoryLiveQueryStorage,
} from './src/live-query/SubscriptionServer'
export {
  SubscriptionListener,
  SubscriptionClientConnection,
  SubscriptionClient,
  SubscriptionChannel,
  LiveQueryChange,
  Unsubscribe,
} from './src/live-query/SubscriptionChannel'

/**
 * A convenient shortcut function to quickly obtain a repository for a specific entity type in Remult.
 *
 * @param entity The entity class type for which you want to get a repository.
 * @returns A repository instance for the specified entity type.
 *
 * Example usage:
 * ```ts
 * await repo(Task).find()
 * await repo(Customer).insert()
 * ```
 */
export function repo<entityType>(entity: ClassType<entityType>) {
  return remult.repo(entity)
}
