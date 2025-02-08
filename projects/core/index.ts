import type { ClassType } from './classType.js'
import type { DataProvider } from './src/data-interfaces.js'
export { ArrayEntityDataProvider } from './src/data-providers/array-entity-data-provider.js'

export type { ClassType } from './classType.js'
/*
 * Public API Surface of remult
 */
export {
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
} from './src/remult3/RepositoryImplementation.js'
export { Entity } from './src/remult3/entity.js'
export { getEntityRef } from './src/remult3/getEntityRef.js'
export {
  Field,
  Fields,
  StringFieldOptions,
  Relations,
} from './src/remult3/Fields.js'
export { IdEntity } from './src/remult3/IdEntity.js'

export {
  describeClass,
  describeBackendMethods,
  describeEntity,
} from './src/remult3/classDescribers.js'
export { EntityOptions, PreprocessFilterEvent } from './src/entity.js'
export {
  DataProvider,
  EntityDataProvider,
  EntityDataProviderGroupByOptions,
  EntityDataProviderFindOptions,
  ErrorInfo,
  EntityError,
  RestDataProviderHttpProvider,
} from './src/data-interfaces.js' //V
export {
  SqlCommand,
  SqlCommandWithParameters,
  SqlImplementation,
  SqlResult,
} from './src/sql-command.js' //V
export {
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
  dbNamesOfOptions,
  CustomSqlFilterBuilderFunction,
  EntityDbNames,
} from './src/filter/filter-consumer-bridge-to-sql-request.js'

export {
  JsonDataProvider,
  JsonEntityStorage,
} from './src/data-providers/json-data-provider.js' //V
export { JsonEntityOpfsStorage } from './src/data-providers/json-entity-opfs-storage.js'
export { JsonEntityIndexedDbStorage } from './src/data-providers/json-entity-indexed-db-data-provider.js'

//export * from './src/data-api'; //reconsider if to make internal
export {
  Controller,
  BackendMethodOptions,
  BackendMethod,
  ProgressListener,
  ForbiddenError,
} from './src/server-action.js'

export {
  Allowed,
  Allow,
  Remult,
  withRemult,
  RemultContext,
  ApiClient,
  isBackend,
  AllowedForInstance,
  EventDispatcher,
  EventSource,
  UserInfo,
} from './src/context.js'
export { ExternalHttpProvider } from './src/buildRestDataProvider.js'
export { SortSegment, Sort } from './src/sort.js'
export { CompoundIdField } from './src/CompoundIdField.js'
export {
  Filter,
  FilterConsumer,
  FilterPreciseValues,
} from './src/filter/filter-interfaces.js'
export { UrlBuilder } from './urlBuilder.js'
export {
  Validators,
  ValidationMessage,
  ValueValidationMessage,
  Validator,
  ValidatorWithArgs,
  valueValidator,
  createValidator,
  createValidatorWithArgs,
  createValueValidatorWithArgs,
  createValueValidator,
} from './src/validators.js'

export { ValueConverters } from './src/valueConverters.js'
export { remult } from './src/remult-proxy.js'
import { remult } from './src/remult-proxy.js'

//export { getId } from './src/remult3/getId';

export {
  SubscriptionServer,
  LiveQueryStorage,
  StoredQuery,
  InMemoryLiveQueryStorage,
} from './src/live-query/SubscriptionServer.js'
export {
  SubscriptionListener,
  SubscriptionClientConnection,
  SubscriptionClient,
  SubscriptionChannel,
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
