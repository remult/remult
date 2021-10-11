import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DataAreaFieldsSetting, DataAreaSettings, IDataAreaSettings } from '@remult/angular';
import { getFields } from 'remult';
import { terms } from '../../terms';


import { DialogService } from '../dialog';



@Component({
  selector: 'app-input-area',
  templateUrl: './input-area.component.html',
  styleUrls: ['./input-area.component.scss']
})
export class InputAreaComponent implements OnInit {
  args!: {
    title: string,
    helpText?: string,
    fields?: () => DataAreaFieldsSetting<any>[];
    areaSettings?: IDataAreaSettings,
    object?: any,
    ok: () => void,
    cancel?: () => void,
    validate?: () => Promise<void>,
    buttons?: button[]
  };
  terms=terms;
  constructor(
    public dialogRef: MatDialogRef<any>,
    private dialog: DialogService

  ) {

    dialogRef.afterClosed().toPromise().then(x => this.cancel());
  }
  area!: DataAreaSettings;

  ngOnInit() {
    if (this.args.areaSettings)
      this.area = new DataAreaSettings(this.args.areaSettings, undefined, undefined);
    else if (this.args.fields) {
      this.area = new DataAreaSettings({ fields: () => this.args.fields!() });
    }
    else if (this.args.object) {
      this.area = new DataAreaSettings({ fields: () => [...getFields(this.args.object)] })
    }
  }
  cancel() {
    if (!this.ok && this.args.cancel)
      this.args.cancel();

  }
  ok = false;
  async confirm() {
    if (this.args.validate) {
      await this.args.validate();

    }
    await this.args.ok();
    this.ok = true;
    this.dialogRef.close();
    return false;
  }
  buttonClick(b: button, e: MouseEvent) {
    e.preventDefault();
    b.click(() => {
      this.dialogRef.close();
    });
  }


}


export interface button {
  text: string,
  click: ((close: () => void) => void);
}