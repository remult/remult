import { DataControl } from '../interfaces'
import { DataControl2Component } from '../src/angular/data-control/data-control2.component'
import { RemultAngularPluginsService } from '../src/angular/RemultAngularPluginsService'
import { DataList } from '../interfaces/src/dataList'
import { Field, Fields, getFields } from '../../core/src/remult3'
import { Remult, Allowed } from '../../core/src/context'
import { createData } from '../../core/src/tests/createData'
import { ArrayEntityDataProvider } from '../../core/src/data-providers/array-entity-data-provider'
import {
  Categories,
  Categories as newCategories,
  CategoriesForTesting,
} from '../../core/src/tests/remult-3-entities'

class classWithColumn {
  static click: classWithColumn
  @DataControl<classWithColumn>({
    click: (r) => (classWithColumn.click = r),
  })
  @Fields.string()
  a = ''
  _ = getFields(this)
}

describe('remult angular', () => {
  it('stand alone data control', async () => {
    let dc = new DataControl2Component(
      new RemultAngularPluginsService(),
      undefined,
    )
    let c = new classWithColumn()
    c.a = '1'
    dc.field = c._.a
    dc.click()
    expect(classWithColumn.click.a).toBe('1')
  })
    it('delete works', async () => {
    let [c] = await createData(async (i) => {
      await i(1, 'a')
      await i(2, 'b')
      await i(3, 'c')
    })
    let rl = new DataList<CategoriesForTesting>(c)
    await rl.get()
    expect(rl.items.length).toBe(3)
    await rl.items[1]._.delete()
    expect(rl.items.length).toBe(2)
  })
   it('delete fails nicely', async () => {
    let cont = new Remult()
    cont.dataProvider = {
      getEntityDataProvider: (x) => {
        let r = new ArrayEntityDataProvider(x, [
          { id: 1 },
          { id: 2 },
          { id: 3 },
        ])
        r.delete = (id) => {
          return Promise.resolve().then(() => {
            throw Promise.resolve('error')
          })
        }
        return r
      },
      transaction: undefined,
    }

    let rl = new DataList<newCategories>(cont.repo(newCategories))
    await rl.get()
    expect(rl.items.length).toBe(3)
    try {
      await rl.items[1]._.delete()
      fail('was not supposed to get here')
    } catch (err) {
      expect(rl.items.length).toBe(3)
      expect(rl.items[1]._.error).toBe('error')
    }
  })
})
