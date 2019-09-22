import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { IDataAreaSettings, DataAreaSettings } from 'radweb';

@Component({
  selector: 'app-input-area',
  templateUrl: './input-area.component.html',
  styleUrls: ['./input-area.component.scss']
})
export class InputAreaComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<InputAreaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InputAreaComponentData
  ) {
    this.area = new DataAreaSettings(data.settings, null, null);
    dialogRef.afterClosed().toPromise().then(x => this.cancel());
  }
  area: DataAreaSettings<any>;

  ngOnInit() {
  }
  cancel() {
    if (!this.ok)
      this.data.cancel();

  }
  ok = false;
  confirm() {
    this.ok = true;
    this.dialogRef.close();
    this.data.ok();
    return false;
  }


}

export interface InputAreaComponentData {
  title: string,
  settings: IDataAreaSettings<any>,
  ok: () => void,
  cancel: () => void
}