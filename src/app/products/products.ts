import { IdEntity, StringColumn, EntityClass, ColumnOptions, Context, ValueListColumn } from '@remult/core';
import { MAT_CHECKBOX_CLICK_ACTION } from '@angular/material';
import { stat } from 'fs';


@EntityClass
export class Products extends IdEntity {
  name = new GroupsColumn(this.context);
  phone = new PhoneColumn({ allowApiUpdate: false });
  test = new StringColumn({
    caption: 'test',
    sqlExpression: "'noam'"
  })
  status = new statusColumn();
  constructor(private context: Context) {
    super({
      name: "Products",
      allowApiCRUD: true,
      allowApiRead: true,
      saving: () => {
        if (context.onServer)
          if (this.name.value.length < 2)
            this.name.validationError = 'the error';
      }
    });
  }
}


class status {
  static active = new status(0, 'active');
  static disabled = new status(10, 'disabled');
  constructor(public id: number, public caption: string) {

  }
}
class statusColumn extends ValueListColumn<status>{
  constructor() {
    super(status);
  }
}


export class PhoneColumn extends StringColumn {
  constructor(settingsOrCaption?: ColumnOptions<string>) {
    super(settingsOrCaption, {
      dataControlSettings: () => ({
        click: () => window.open('tel:' + this.displayValue),
        allowClick: () => !!this.displayValue,
        clickIcon: 'phone',
        inputType: 'phone'
      })
    });
  }
  get displayValue() {
    return PhoneColumn.formatPhone(this.value);
  }

  static formatPhone(s: string) {
    if (!s)
      return s;
    let x = s.replace(/\D/g, '');
    if (x.length < 9 || x.length > 10)
      return s;
    x = x.substring(0, x.length - 4) + '-' + x.substring(x.length - 4, x.length);

    x = x.substring(0, x.length - 8) + '-' + x.substring(x.length - 8, x.length);
    return x;
  }
}

export class GroupsColumn extends StringColumn {
  constructor(private context: Context) {
    super({
      caption: 'שיוך לקבוצת חלוקה',
      includeInApi: true,
      dataControlSettings: () => ({
        width: '300',
        forceEqualFilter: false,
        click: () => { }


      })
    });
  }
  removeGroup(group: string) {
    let groups = this.value.split(",").map(x => x.trim());
    let index = groups.indexOf(group);
    if (index >= 0) {
      groups.splice(index, 1);
      this.value = groups.join(", ");
    }
  }
  addGroup(group: string) {
    if (this.value)
      this.value += ', ';
    else
      this.value = '';
    this.value += group;
  }

  selected(group: string) {
    if (!this.value)
      return false;
    return this.value.indexOf(group) >= 0;
  }

}