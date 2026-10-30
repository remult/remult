import { remultStatic } from '../remult-static.js'

// Without a working AsyncLocalStorage parallel queries read as recursion: a wrong
// placeholder, but undetected recursion would never end.
const inProgress = new Set<object>()

// Parallel queries share metadata, so only the async call chain tells them from recursion.
export function isSqlExpressionInProgress(owner: object): boolean {
  const chain = remultStatic.sqlExpressionChain
  return chain ? !!chain.getStore()?.includes(owner) : inProgress.has(owner)
}

export async function runSqlExpression<T>(
  owner: object,
  sqlExpression: () => T | Promise<T>,
): Promise<T> {
  const chain = remultStatic.sqlExpressionChain
  if (chain)
    return chain.run([...(chain.getStore() ?? []), owner], async () =>
      sqlExpression(),
    )
  inProgress.add(owner)
  try {
    return await sqlExpression()
  } finally {
    inProgress.delete(owner)
  }
}
