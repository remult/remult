import type { EntityMetadata } from './remult3/remult3.js'

export interface SqlImplementation extends HasWrapIdentifier {
  getLimitSqlSyntax(limit: number, offset: number)
  createCommand(): SqlCommand
  transaction(action: (sql: SqlImplementation) => Promise<void>): Promise<void>
  entityIsUsedForTheFirstTime(entity: EntityMetadata): Promise<void>
  ensureSchema?(entities: EntityMetadata[]): Promise<void>
  supportsJsonColumnType?: boolean
  orderByNullsFirst?: boolean

  afterMutation?: VoidFunction
}
export interface HasWrapIdentifier {
  wrapIdentifier?(name: string): string
}

export interface SqlCommand extends SqlCommandWithParameters {
  execute(sql: string): Promise<SqlResult>
}
export interface SqlCommandWithParameters {
  /** @deprecated @deprecated use `param` instead*/
  addParameterAndReturnSqlToken(val: any): string
  // Adds a parameter to the command and returns the token to be used in the sql
  param(val: any): string
}

export interface SqlResult {
  rows: any[]
  getColumnKeyInResultForIndexInSelect(index: number): string
  //we need this because in postgres the names of the members in the json result are all lowercase and do not match the name and alias in the select
}
