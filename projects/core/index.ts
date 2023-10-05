/*
 * Public API Surface of remult
 */
export {
  OmitEB,
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
} from './src/remult3/remult3.js'
export {
  Field,
  Fields,
  IdEntity,
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

export { StringFieldOptions } from './src/remult3/RepositoryImplementation.js'
export { describeClass } from './src/remult3/DecoratorReplacer.js'
export { EntityOptions } from './src/entity.js'
export {
  DataProvider,
  EntityDataProvider,
  EntityDataProviderFindOptions,
  ErrorInfo,
  RestDataProviderHttpProvider,
} from './src/data-interfaces.js' //V
export { SqlCommand, SqlImplementation, SqlResult } from './src/sql-command.js' //V
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
export { ArrayEntityDataProvider } from './src/data-providers/array-entity-data-provider.js' //V
export { WebSqlDataProvider } from './src/data-providers/web-sql-data-provider.js' //V
export { SqlDatabase } from './src/data-providers/sql-database.js' //V
export {
  CustomSqlFilterObject,
  CustomSqlFilterBuilder,
  dbNamesOf,
} from './src/filter/filter-consumer-bridge-to-sql-request.js'

export {
  JsonDataProvider,
  JsonEntityStorage,
} from './src/data-providers/json-data-provider.js' //V

//export * from './src/data-api'; //reconsider if to make internal
export {
  Controller,
  BackendMethodOptions,
  BackendMethod,
  ProgressListener,
} from './src/server-action.js'

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
} from './src/context.js'
export { ExternalHttpProvider } from './src/buildRestDataProvider.js'
export { SortSegment, Sort } from './src/sort.js'
export { OneToMany } from './src/column.js'
export { CompoundIdField } from './src/CompoundIdField.js'
export { Filter } from './src/filter/filter-interfaces.js'
export { UrlBuilder } from './urlBuilder.js'
export { Validators } from './src/validators.js'

export { ValueConverters } from './src/valueConverters.js'
export { remult } from './src/remult-proxy.js'
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
