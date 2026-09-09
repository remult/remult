import type { ClassType } from './classType.js'
import type { DataProvider } from './src/data-interfaces.js'
export { ArrayEntityDataProvider } from './src/data-providers/array-entity-data-provider.js'

export type { ClassType } from './classType.js'
/*
 * Public API Surface of remult
 */
export type {
  ValidateFieldEvent,
  MembersOnly,
  NumericKeys,
  FieldsMetadata,
  FieldRef,
  IdFieldRef,
  FieldsRef,
  EntityMetadata,
  EntityOrderBy,
  EntityFilter,
  FindOptions,
  FindOptionsBase,
  QueryResult,
  QueryOptions,
  UpsertOptions,
  Repository,
  GroupByOptions,
  GroupByResult,
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
  EntitySelectFields,
  InsertOrUpdateOptions,
  ClassFieldDecorator,
  ClassFieldDecoratorContextStub, //n1 consider removing in ts5
  LifecycleEvent,
  FieldsRefBase,
  FieldsRefForEntityBase,
  RepositoryRelationsForEntityBase,
  ControllerRefForControllerBase,
  ControllerRefBase,
  ControllerRef,
  EntityRefForEntityBase,
  IdMetadata,
  FindFirstOptionsBase,
} from './src/remult3/remult3.js'
export { standardSchema } from './src/standard-schema/index.js'
export {
  EntityBase,
  ControllerBase,
  FieldType,
  getFields,
  ValueListFieldType,
  getValueList,
  ValueListInfo,
} from './src/remult3/RepositoryImplementation.js'
export type { ValueListFieldOptions } from './src/remult3/RepositoryImplementation.js'
import { LabelTransformer } from './src/remult3/RepositoryImplementation.js'
export { LabelTransformer } from './src/remult3/RepositoryImplementation.js'
/**
 * @deprecated use `LabelTransformer` instead
 */
export const CaptionTransformer = LabelTransformer
export { Entity } from './src/remult3/entity.js'
export { getEntityRef } from './src/remult3/getEntityRef.js'
export { Field, Fields, Relations } from './src/remult3/Fields.js'
export type { StringFieldOptions } from './src/remult3/Fields.js'
export { IdEntity } from './src/remult3/IdEntity.js'

export {
  describeClass,
  describeBackendMethods,
  describeEntity,
} from './src/remult3/classDescribers.js'
export type { EntityOptions, PreprocessFilterEvent } from './src/entity.js'
export { EntityError } from './src/data-interfaces.js' //V
export type {
  DataProvider,
  DroppableDataProvider,
  EntityDataProvider,
  EntityDataProviderGroupByOptions,
  EntityDataProviderFindOptions,
  ErrorInfo,
  RestDataProviderHttpProvider,
} from './src/data-interfaces.js'
export type {
  SqlCommand,
  SqlCommandWithParameters,
  SqlImplementation,
  SqlResult,
} from './src/sql-command.js' //V
export type {
  FieldMetadata,
  FieldOptions,
  FieldValidator,
  ValueConverter,
  ValueListItem, // reconsider, maybe it should go to remult angular as the abstraction ?
  ValueOrExpression,
} from './src/column-interfaces.js' // revisit input type
export { RestDataProvider } from './src/data-providers/rest-data-provider.js' //V
export { InMemoryDataProvider } from './src/data-providers/in-memory-database.js' //V
export { SqlDatabase } from './src/data-providers/sql-database.js' //V

export {
  CustomSqlFilterBuilder,
  dbNamesOf,
} from './src/filter/filter-consumer-bridge-to-sql-request.js'
export type {
  dbNamesOfOptions,
  CustomSqlFilterBuilderFunction,
  EntityDbNames,
} from './src/filter/filter-consumer-bridge-to-sql-request.js'

export { JsonDataProvider } from './src/data-providers/json-data-provider.js' //V
export type { JsonEntityStorage } from './src/data-providers/json-data-provider.js'
export { JsonEntityOpfsStorage } from './src/data-providers/json-entity-opfs-storage.js'
export { JsonEntityIndexedDbStorage } from './src/data-providers/json-entity-indexed-db-data-provider.js'
export {
  IndexedDbDataProvider,
  IndexedDbIndexBuilder,
} from './src/data-providers/indexed-db-data-provider.js'
export type {
  IndexedDbDataProviderOptions,
  IndexedDbIndexDef,
} from './src/data-providers/indexed-db-data-provider.js'

//export * from './src/data-api'; //reconsider if to make internal
export {
  Controller,
  BackendMethod,
  ProgressListener,
  ForbiddenError,
} from './src/server-action.js'
export type { BackendMethodOptions } from './src/server-action.js'

export {
  Allow,
  Remult,
  withRemult,
  isBackend,
  EventSource,
} from './src/context.js'
export type {
  Allowed,
  RemultContext,
  ApiClient,
  AllowedForInstance,
  EventDispatcher,
  UserInfo,
} from './src/context.js'
export type { ExternalHttpProvider } from './src/buildRestDataProvider.js'
export { Sort } from './src/sort.js'
export type { SortSegment } from './src/sort.js'
export { CompoundIdField } from './src/CompoundIdField.js'
export { Filter } from './src/filter/filter-interfaces.js'
export type {
  FilterConsumer,
  FilterPreciseValues,
} from './src/filter/filter-interfaces.js'
export { UrlBuilder } from './urlBuilder.js'
export {
  Validators,
  valueValidator,
  createValidator,
  createValidatorWithArgs,
  createValueValidatorWithArgs,
  createValueValidator,
} from './src/validators.js'
export type {
  ValidationMessage,
  ValueValidationMessage,
  Validator,
  ValidatorWithArgs,
} from './src/validators.js'

export { ValueConverters } from './src/valueConverters.js'
export { remult } from './src/remult-proxy.js'
import { remult } from './src/remult-proxy.js'

//export { getId } from './src/remult3/getId';

export { InMemoryLiveQueryStorage } from './src/live-query/SubscriptionServer.js'
export type {
  SubscriptionServer,
  LiveQueryStorage,
  StoredQuery,
} from './src/live-query/SubscriptionServer.js'
export { SubscriptionChannel } from './src/live-query/SubscriptionChannel.js'
export type {
  SubscriptionListener,
  SubscriptionClientConnection,
  SubscriptionClient,
  LiveQueryChange,
  Unsubscribe,
} from './src/live-query/SubscriptionChannel.js'

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
export function repo<entityType>(
  entity: ClassType<entityType>,
  dataProvider?: DataProvider,
) {
  return remult.repo(entity, dataProvider)
}
