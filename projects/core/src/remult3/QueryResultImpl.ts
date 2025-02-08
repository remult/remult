import { queryConfig } from '../context.js'
import type { ProxyEntityDataProvider } from '../data-interfaces.js'
import { isOfType } from '../isOfType.js'
import { Sort } from '../sort.js'
import { RelationLoader } from './relation-loader.js'
import type {
  QueryResult,
  QueryOptions,
  EntityFilter,
  Paginator,
  GroupByOptions,
} from './remult3.js'
import type { RepositoryImplementation } from './RepositoryImplementation.js'

export class QueryResultImpl<entityType> implements QueryResult<entityType> {
  constructor(
    private options: QueryOptions<entityType>,
    private repo: RepositoryImplementation<entityType>,
  ) {
    if (!this.options) this.options = {}
    if (!this.options.pageSize) {
      this.options.pageSize = queryConfig.defaultPageSize
    }
  }
  private _count: number | undefined = undefined
  private _aggregates: any
  async getPage(page?: number) {
    if ((page ?? 0) < 1) page = 1

    return this.repo.find({
      where: this.options.where,
      orderBy: this.options.orderBy,
      limit: this.options.pageSize,
      page: page,
      load: this.options.load,
      include: this.options.include,
    })
  }

  async count() {
    if (this._count === undefined)
      this._count = await this.repo.count(this.options.where)
    return this._count
  }
  async forEach(what: (item: entityType) => Promise<any>) {
    let i = 0
    for await (const x of this) {
      await what(x)
      i++
    }
    return i
  }

  async paginator(
    pNextPageFilter?: EntityFilter<entityType>,
  ): Promise<Paginator<entityType>> {
    this.options.orderBy = Sort.createUniqueEntityOrderBy(
      this.repo.metadata,
      this.options.orderBy,
    )

    let options = {
      where: {
        $and: [this.options.where, pNextPageFilter],
      } as EntityFilter<entityType>,
      orderBy: this.options.orderBy,
      limit: this.options.pageSize,
      load: this.options.load,
      include: this.options.include,
    }
    let getItems = () => this.repo.find(options)

    if (
      this._aggregates === undefined &&
      isOfType<{
        aggregate: GroupByOptions<entityType, any, any, any, any, any, any>
      }>(this.options, 'aggregate')
    ) {
      let agg = this.options.aggregate
      if (!this.repo._dataProvider.isProxy) {
        let itemsPromise = getItems()
        getItems = async () => {
          this._aggregates = await this.repo.aggregate({
            ...agg,
            where: this.options.where,
          } as any)
          this._count = this._aggregates.$count
          return itemsPromise
        }
      } else {
        const loader = new RelationLoader()
        getItems = () =>
          this.repo
            ._rawFind(options, false, loader, async (opt) => {
              const r = await (
                this.repo._edp as unknown as ProxyEntityDataProvider
              ).query(opt, await this.repo.__buildGroupByOptions(agg as any))
              this._aggregates = r.aggregates
              return r.items
            })
            .then(async (y) => {
              await loader.resolveAll()
              return y
            })
      }
    }
    let items = await getItems()

    let nextPage: () => Promise<Paginator<entityType>> = () => {
      throw new Error('no more pages')
    }
    let hasNextPage = items.length == this.options.pageSize
    if (hasNextPage) {
      let nextPageFilter = await this.repo._createAfterFilter(
        this.options.orderBy,
        items[items.length - 1],
      )
      nextPage = () => this.paginator(nextPageFilter)
    }
    return {
      count: () => this.count(),
      hasNextPage,
      items,
      nextPage,
      //@ts-ignore
      aggregates: this._aggregates,
    }
  }

  [Symbol.asyncIterator]() {
    if (!this.options.where) {
      this.options.where = {}
    }
    let ob = this.options.orderBy
    this.options.orderBy = Sort.createUniqueEntityOrderBy(
      this.repo.metadata,
      ob,
    )

    let itemIndex = -1
    let currentPage: Paginator<entityType> | undefined = undefined

    let itStrategy: () => Promise<IteratorResult<entityType>>

    let j = 0

    itStrategy = async () => {
      if (this.options.progress) {
        this.options.progress.progress(j++ / (await this.count()))
      }
      if (currentPage === undefined || itemIndex == currentPage.items.length) {
        if (currentPage && !currentPage.hasNextPage)
          return { value: undefined, done: true }
        let prev = currentPage
        if (currentPage) currentPage = await currentPage.nextPage!()
        else currentPage = await this.paginator()

        itemIndex = 0
        if (currentPage.items.length == 0) {
          return { value: undefined, done: true }
        } else {
          if (prev?.items.length ?? 0 > 0) {
            if (
              this.repo.getEntityRef(prev!.items[0]).getId() ==
              this.repo.getEntityRef(currentPage.items[0]).getId()
            )
              throw new Error('pagination failure, returned same first row')
          }
        }
      }
      if (itemIndex < currentPage.items.length)
        return { value: currentPage.items[itemIndex++], done: false }
      return { done: true, value: undefined }
    }
    return {
      next: async () => {
        let r = itStrategy()
        return r
      },
    }
  }
}
