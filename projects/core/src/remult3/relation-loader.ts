import type { Remult } from '../context'
import { findOptionsToJson } from '../data-providers/rest-data-provider'
import type { RelationLoaderHelper } from './relation-loader-types'
import type { FindOptions } from './remult3'

export class RelationLoader {
  entityLoaders = new Map<any, EntityLoader>()
  promises = []
  load(
    rel: RelationLoaderHelper<any>,
    findOptions: FindOptions<any>,
  ): Promise<any[]> {
    let e = this.entityLoaders.get(rel.entityType)
    if (!e) {
      this.entityLoaders.set(rel.entityType, (e = new EntityLoader(rel)))
    }
    const p = e.find(findOptions)
    this.promises.push(p)
    return p
  }
  constructor() {}
  async resolveAll() {
    if (this.promises.length === 0) return
    const x = this.promises
    this.promises = []
    await Promise.all(x)
    await this.resolveAll()
  }
}
class EntityLoader {
  queries = new Map<
    string,
    {
      result: Promise<any[]>
    }
  >()

  find(findOptions: FindOptions<any>) {
    const jsonOptions = findOptionsToJson(findOptions, this.rel.metadata)
    const key = JSON.stringify(jsonOptions)
    let q = this.queries.get(key)
    if (!q) {
      this.queries.set(
        key,
        (q = {
          result: this.rel.find(findOptions),
        }),
      )
    }
    return q.result
  }
  constructor(private rel: RelationLoaderHelper<any>) {}
}
