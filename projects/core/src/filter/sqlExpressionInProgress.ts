const sqlExpressionInProgressKey = Symbol.for(`sqlExpressionInProgressKey`)

export function isSqlExpressionInProgress(owner: object): boolean {
  return (owner as any)[sqlExpressionInProgressKey]
}

export async function runSqlExpression<T>(
  owner: object,
  sqlExpression: () => T | Promise<T>,
): Promise<T> {
  try {
    ;(owner as any)[sqlExpressionInProgressKey] = true
    return await sqlExpression()
  } finally {
    delete (owner as any)[sqlExpressionInProgressKey]
  }
}
