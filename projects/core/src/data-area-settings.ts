import { Entity } from "./entity";
import { DataControlSettings, DataControlInfo } from "./column-interfaces";
import { ColumnCollection } from "./column-collection";
import { isArray } from "util";
import { Column } from './column';

export interface IDataAreaSettings<rowType  extends Entity<any>> {
  columnSettings?: (rowType: rowType) => DataArealColumnSetting<rowType>[];
  numberOfColumnAreas?: number;
  labelWidth?: number;
}

export class DataAreaSettings<rowType extends Entity<any>>
{
  lines: DataControlSettings<any>[][] = [];
  constructor(public settings?: IDataAreaSettings<rowType>, public columns?: ColumnCollection<rowType>, entity?: rowType) {
    if (columns == undefined) {
      columns = new ColumnCollection<rowType>(() => undefined, () => true, undefined, () => true);
      columns.numOfColumnsInGrid = 0;
      this.columns = columns;
    }
    if (settings && settings.columnSettings) {


      for (const colSettings of settings.columnSettings(entity)) {
        if (isArray(colSettings)) {
          let x = columns.items.length;
          //@ts-ignore
          columns.add(...colSettings);
          let line = [];
          for (let index = x; index < columns.items.length; index++) {
            line.push(columns.items[index]);
          }
          this.lines.push(line);
        } else {
          columns.add(<DataControlSettings<rowType>>colSettings);
          this.lines.push([columns.items[columns.items.length - 1]]);

        }
      }


    }

  }
}


export type DataArealColumnSetting<rowType extends Entity<any>> = DataControlInfo<rowType> | DataControlInfo<rowType>[];


export interface dataAreaSettings {
  columns: ColumnCollection<any>;
  lines: DataControlSettings<any>[][];
}