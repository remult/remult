import { v4 as uuid } from 'uuid';



import { ColumnOptions, DataColumnSettings } from './column-interfaces';
import { Column } from './column';
import { Entity, EntityOptions } from './entity';
import { StringColumn } from './columns/string-column';
import { EntityProvider } from './data-interfaces';



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

export function DecorateDataColumnSettings<type>(original: ColumnOptions<type>, addValues: (x: DataColumnSettings<type>) => void) {
  let result: DataColumnSettings<type> = {};
  if (typeof (original) == "string")
    result.caption = original;
  else if (original)
    result = original;
  addValues(result);
  return result;
}
export async function checkForDuplicateValue(row: Entity<any>, column: Column<any>,provider: EntityProvider<any>, message?: string) {
  if (row.isNew() || column.value != column.originalValue) {
    let rows = await provider.find({ where:r=>r.__getColumn(column).isEqualTo(column.value) });
    if (rows.length > 0)
      column.error = message || 'Already exists';
  }

}