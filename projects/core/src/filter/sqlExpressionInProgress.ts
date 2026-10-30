// Parallel queries share metadata, so only the async call chain tells them from
// recursion. Not a static import: core is also bundled for the browser.
const hooks = (globalThis as any).process?.getBuiltinModule?.(
  'node:async_hooks',
)
const chain = hooks && new hooks.AsyncLocalStorage()

export function isSqlExpressionInProgress(owner: object): boolean {
  return chain?.getStore()?.includes(owner)
}

export async function runSqlExpression<T>(
  owner: object,
  sqlExpression: () => T | Promise<T>,
): Promise<T> {
  if (!chain) return sqlExpression()
  return chain.run([...(chain.getStore() ?? []), owner], sqlExpression)
}
