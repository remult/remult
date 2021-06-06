import {  FieldDefinitionsOf } from "@remult/core";

import { ColumnCollection } from "./column-collection";
import { DataControlInfo, DataControlSettings } from "./data-control-interfaces";

export interface IDataAreaSettings<rowType=any > {
  columnSettings?: (rowType: FieldDefinitionsOf<rowType>) => DataArealColumnSetting<rowType>[];
  numberOfColumnAreas?: number;
  labelWidth?: number;
}

export class DataAreaSettings<rowType =any>
{
  lines: DataControlSettings[][] = [];
  constructor(public settings?: IDataAreaSettings<rowType>, public columns?: ColumnCollection<rowType>, entity?:FieldDefinitionsOf<rowType>) {
    if (columns == undefined) {
      columns = new ColumnCollection<rowType>(() => undefined, () => true, undefined, () => true,()=>undefined);
      columns.numOfColumnsInGrid = 0;
      this.columns = columns;
    }
    if (settings && settings.columnSettings) {


      for (const colSettings of settings.columnSettings(entity)) {
        if (Array.isArray(colSettings)) {
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


export type DataArealColumnSetting<rowType > = DataControlInfo<rowType> | DataControlInfo<rowType>[];

