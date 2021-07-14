import {   Fields, FieldsMetadata } from "@remult/core";

import { FieldCollection } from "./column-collection";
import { DataControlInfo, DataControlSettings } from "./data-control-interfaces";

export interface IDataAreaSettings<rowType=any > {
  fields?: (rowType: FieldsMetadata<rowType>) => DataAreaFieldsSetting<rowType>[];
  numberOfColumnAreas?: number;
  labelWidth?: number;
}

export class DataAreaSettings<rowType =any>
{
  lines: DataControlSettings[][] = [];
  constructor(public settings?: IDataAreaSettings<rowType>, public fields?: FieldCollection<rowType>, entity?:FieldsMetadata<rowType>) {
    if (fields == undefined) {
      fields = new FieldCollection<rowType>(() => undefined, () => true, undefined, () => true,()=>undefined);
      fields.numOfColumnsInGrid = 0;
      this.fields = fields;
    }
    if (settings && settings.fields) {


      for (const colSettings of settings.fields(entity)) {
        if (Array.isArray(colSettings)) {
          let x = fields.items.length;
          //@ts-ignore
          fields.add(...colSettings);
          let line = [];
          for (let index = x; index < fields.items.length; index++) {
            line.push(fields.items[index]);
          }
          this.lines.push(line);
        } else {
          fields.add(<DataControlSettings<rowType>>colSettings);
          let x = fields.items[fields.items.length - 1];
          x.width='';
          this.lines.push([x]);

        }
      }


    }

  }
}


export type DataAreaFieldsSetting<rowType > = DataControlInfo<rowType> | DataControlInfo<rowType>[];

