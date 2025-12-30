import type { QueryOptions, QueryResult, Repository } from './remult3.js'

export function pagedQueryResult<T>(
  r: Repository<T>,
  o: QueryOptions<T>,
  getPage: (pageNumber?: number) => Promise<T[]>,
): QueryResult<T> {
  const iterator = () => {
    let pageNumber = 1
    let currentPage: T[] = []
    let itemIndex = 0
    return {
      next: async (): Promise<IteratorResult<T, T>> => {
        if (itemIndex >= currentPage.length) {
          currentPage = await getPage(pageNumber)
          if (currentPage.length === 0) {
            return { value: undefined as any, done: true }
          }
          pageNumber++
          itemIndex = 0
        }
        const value = currentPage[itemIndex++]
        return { value, done: false }
      },
    }
  }
  return {
    count: async () => r.count(o?.where),
    getPage,
    forEach: async (what: (item: T) => Promise<any>) => {
      let i = 0
      const it = iterator()
      while (true) {
        const { value, done } = await it.next()
        if (done) break
        await what(value)
        i++
      }
      return i
    },
    [Symbol.asyncIterator]: iterator,
    paginator: async () => {
      const createPaginator = async (pageNumber: number) => {
        const items = await getPage(pageNumber)
        const hasNextPage = items.length === o.pageSize!
        const emptyPaginator = {
          items: [] as T[],
          hasNextPage: false,
          count: async () => r.count(o?.where),
          nextPage: async () => emptyPaginator,
        }
        return {
          items,
          hasNextPage,
          count: async () => r.count(o?.where),
          nextPage: async () => {
            if (!hasNextPage) {
              return emptyPaginator
            }
            return createPaginator(pageNumber + 1)
          },
        }
      }
      return createPaginator(1)
    },
  }
}
