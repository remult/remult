import { findOptionsToJson } from '../data-providers/rest-data-provider.js'
import { getEntityRef } from './getEntityRef.js'
import type { RelationLoaderHelper } from './relation-loader-types.js'
import { getRelationInfo } from './relationInfoMember.js'
import type { FindOptions, IdFieldRef } from './remult3.js'

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
    for (const entity of this.entityLoaders.values()) {
      for (const variation of entity.queries.values()) {
        variation.resolve()
      }
    }
    if (this.promises.length === 0) return
    const x = this.promises
    this.promises = []
    await Promise.all(x)
    await this.resolveAll()
  }
}
class EntityLoader {
  queries = new Map<string, QueryVariation>()

  find(findOptions: FindOptions<any>) {
    const { where, ...options } = findOptionsToJson(
      findOptions,
      this.rel.metadata,
    )
    const optionKeys = JSON.stringify(options)
    let q = this.queries.get(optionKeys)
    if (!q) {
      this.queries.set(optionKeys, (q = new QueryVariation(this.rel)))
    }

    return q.find(findOptions, where)
  }
  constructor(private rel: RelationLoaderHelper<any>) {}
}
class QueryVariation {
  find(findOptions: FindOptions<any>, where: any) {
    const whereKey = JSON.stringify(where)
    let w = this.whereVariations.get(whereKey)
    if (!w) {
      const keys = Object.keys(where)
      if (
        keys.length === 1 &&
        typeof where[keys[0]] !== 'object' &&
        !findOptions.limit // because merging calls in that case may bring non more rows than the limit
      ) {
        let inVariation = this.pendingInStatements.get(keys[0])
        if (!inVariation) {
          this.pendingInStatements.set(
            keys[0],
            (inVariation = new PendingInStatements(
              this.rel,
              keys[0],
              findOptions,
            )),
          )
        }
        this.whereVariations.set(
          whereKey,
          (w = {
            result: inVariation.find(where),
          }),
        )
      } else {
        this.whereVariations.set(
          whereKey,
          (w = {
            result: this.rel.find(findOptions),
          }),
        )
      }
    }

    return w.result
  }
  constructor(private rel: RelationLoaderHelper<any>) {}
  resolve() {
    const statements = [...this.pendingInStatements.values()]
    this.pendingInStatements.clear()
    for (const statement of statements) {
      statement.resolve()
    }
  }
  pendingInStatements = new Map<string, PendingInStatements>()
  whereVariations = new Map<
    string,
    {
      result: Promise<any[]>
    }
  >()
}
class PendingInStatements {
  async resolve() {
    const values = [...this.values.values()]
    if (values.length == 1) {
      this.rel.find(this.options).then(values[0].resolve, values[0].reject)
      return
    }
    var op = { ...this.options }
    op.where = { [this.key]: values.map((v) => v.value) }
    op.limit = 1000
    op.page = 1
    let vals = []
    try {
      while (true) {
        const val = await this.rel.find(op)
        vals.push(...val)
        if (val.length < op.limit) break
        op.page++
      }
      for (const value of this.values.values()) {
        value.resolve(
          vals.filter((x) => {
            const ref = getEntityRef(x)
            const field = ref.fields.find(this.key)
            const rel = getRelationInfo(field.metadata.options)
            const val =
              rel?.type === 'reference'
                ? (field as IdFieldRef<any, any>).getId()
                : x[this.key]
            return value.value == val
          }),
        )
      }
    } catch (err) {
      for (const value of this.values.values()) {
        value.reject(err)
      }
    }
  }
  find(where: any): Promise<any[]> {
    const val = where[this.key]
    let valHandler = this.values.get(val)
    if (!valHandler) {
      let resolve: (what: any[]) => void
      let reject: (err: any) => void
      let result = new Promise<any[]>((resolve1, reject1) => {
        resolve = resolve1
        reject = reject1
      })
      this.values.set(
        val,
        (valHandler = {
          value: val,
          resolve,
          reject,
          result,
        }),
      )
    }
    return valHandler.result
  }
  values = new Map<
    any,
    {
      value: any
      resolve: (value: any[]) => void
      reject: (error: any) => void
      result: Promise<any[]>
    }
  >()
  constructor(
    private rel: RelationLoaderHelper<any>,
    private key: string,
    private options: FindOptions<any>,
  ) {}
}
