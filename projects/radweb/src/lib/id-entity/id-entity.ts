import { v4 as uuid } from 'uuid';
import { StringColumn, Entity, Column, EntityOptions } from "../core/utils";

import { ColumnOptions, DataColumnSettings } from '../core/dataInterfaces1';



export class IdEntity extends Entity<string>
{
  id= new IdColumn();
  constructor(options?: EntityOptions | string) {
    super(options);
    
    this.id.allowApiUpdate = false;
    let x = this.__onSavingRow;
    this.__onSavingRow = () => {
      if (this.isNew() && !this.id.value && !this.disableNewId)
        this.id.setToNewId();
      return x();
    }
  }
  private disableNewId = false;
  setEmptyIdForNewRow() {
    this.id.value = '';
    this.disableNewId = true;
  }
}

export class IdColumn extends StringColumn {
  setToNewId() {
    this.value = uuid();
  }
}
export async function checkForDuplicateValue(row: Entity<any>, column: Column<any>, message?: string) {
  if (row.isNew() || column.value != column.originalValue) {
    let rows = await row.__killMeSource.find({ where: column.isEqualTo(column.value) });
    if (rows.length > 0)
      column.error = message || 'Already exists';
  }

}
export function DecorateDataColumnSettings<type>(original: ColumnOptions<type>, addValues: (x: DataColumnSettings<type>) => void) {
  let result: DataColumnSettings<type> = {};
  if (typeof (original) == "string")
    result.caption = original;
  else
    result = original;
  addValues(result);
  return result;
}