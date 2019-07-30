import { v4 as uuid } from 'uuid';
import { StringColumn, Entity, Column } from "../core/utils";
import { ContextEntity, ContextEntityOptions } from '../context/Context';
import { DataColumnSettings } from '../core/dataInterfaces1';


export class IdEntity<idType extends IdColumn> extends ContextEntity<string>
{
  id: idType;
  constructor(id: idType, options?: ContextEntityOptions | string) {
    super(options);
    this.id = id;
    id.readonly = true;
    let x = this.onSavingRow;
    this.onSavingRow = () => {
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
    let rows = await row.source.find({ where: column.isEqualTo(column.value) });
    console.log(rows.length);
    if (rows.length > 0)
      column.error = message || 'Already exists';
  }

}
export function DecorateDataColumnSettings<type, colType>(original: DataColumnSettings<type, colType> | string, addValues: (x: DataColumnSettings<type, colType>) => void) {
  let result: DataColumnSettings<type, colType> = {};
  if (typeof (original) == "string")
    result.caption = original;
  else
    result = original;
  addValues(result);
  return result;
}