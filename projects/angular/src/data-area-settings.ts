import {  FieldDefinitionsOf } from "@remult/core";

import { FieldCollection } from "./column-collection";
import { DataControlInfo, DataControlSettings } from "./data-control-interfaces";

export interface IDataAreaSettings<rowType=any > {
  fields?: (rowType: FieldDefinitionsOf<rowType>) => DataAreaFieldsSetting<rowType>[];
  numberOfColumnAreas?: number;
  labelWidth?: number;
}

export class DataAreaSettings<rowType =any>
{
  lines: DataControlSettings[][] = [];
  constructor(public settings?: IDataAreaSettings<rowType>, public columns?: FieldCollection<rowType>, entity?:FieldDefinitionsOf<rowType>) {
    if (columns == undefined) {
      columns = new FieldCollection<rowType>(() => undefined, () => true, undefined, () => true,()=>undefined);
      columns.numOfColumnsInGrid = 0;
      this.columns = columns;
    }
    if (settings && settings.fields) {


      for (const colSettings of settings.fields(entity)) {
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


export type DataAreaFieldsSetting<rowType > = DataControlInfo<rowType> | DataControlInfo<rowType>[];

