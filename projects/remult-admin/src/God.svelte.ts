import { remult } from '../../core/src/remult-proxy'
import {
  EntityUIInfo,
  FieldRelationToOneInfo,
  FieldUIInfo,
} from '../../core/server/remult-admin'
import { Repository } from '../../core/src/remult3/remult3'
import { Fields } from '../../core/src/remult3/Fields'
import { Entity } from '../../core/src/remult3/entity'

declare const entities: EntityUIInfo[]

export class God {
  tables: (EntityUIInfo & { repo: Repository<unknown> })[] = $state()

  constructor() {
    this.tables = []

    // RUNE We can't await in the constructor... What is a good pattern to use here?
    this.init()
  }

  async init() {
    let myEntities: EntityUIInfo[] = []

    if (import.meta.env.DEV) {
      const res = await fetch('/api/dev-admin')
      const json = await res.json()
      myEntities = json
      // .then((res) => res.json())
      // .then((json) => {
      //   myEntities = json
      // })
    } else {
      myEntities = entities
    }

    this.tables = myEntities.map((info) => {
      class C {}
      for (const f of info.fields) {
        switch (f.type) {
          case 'json':
            Fields.json()(C.prototype, f.key as keyof typeof C.prototype)
            break
          case 'number':
            Fields.number()(C.prototype, f.key)
            break
          case 'boolean':
            Fields.boolean()(C.prototype, f.key)
            break
          default:
            Fields.string()(C.prototype, f.key)
            break
        }
      }
      Entity(info.key, {
        allowApiCrud: true,
        caption: info.caption,
        id: info.ids,
      })(C)
      return {
        ...info,
        repo: remult.repo(C),
      }
    })
  }

  async getItemsForSelect(
    relation: FieldRelationToOneInfo,
    search: string | undefined,
  ) {
    const repo = this.tables.find((t) => t.key == relation.entityKey)!.repo
    return (
      await repo.find({
        limit: 25,
        orderBy: {
          [relation.captionField]: 'asc',
        },
        where: {
          [relation.captionField]: search
            ? {
                $contains: search,
              }
            : undefined,
        },
      })
    ).map((x) => ({
      id: x[relation.idField],
      caption: x[relation.captionField],
    }))
  }
  async displayValueFor(field: FieldUIInfo, value: any) {
    const relations = field.relationToOne!

    const repo = this.tables.find((t) => t.key == relations.entityKey)!.repo
    const item = await repo.findId(value)
    if (!item) return 'not found - ' + value
    return item[relations.captionField]
  }
}
