import { DataControl } from '../../../angular/interfaces'
import { DataControl2Component } from '../../../angular/src/angular/data-control/data-control2.component'
import { RemultAngularPluginsService } from '../../../angular/src/angular/RemultAngularPluginsService'
import { Field, Fields, getFields } from '../remult3'

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
})
