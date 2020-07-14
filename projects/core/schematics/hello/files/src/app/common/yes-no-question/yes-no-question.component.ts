import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-yes-no-question',
  templateUrl: './yes-no-question.component.html',
  styleUrls: ['./yes-no-question.component.scss']
})
export class YesNoQuestionComponent implements OnInit {
  okPressed = false;
  args: {
    message: string,
    isAQuestion?: boolean
  }

  constructor(
    private dialogRef: MatDialogRef<any>) {

  }

  ngOnInit() {
    if (this.args.isAQuestion === undefined)
      this.args.isAQuestion = true;
  }
  close() {
    this.dialogRef.close();
  }
  select() {
    this.dialogRef.close();
    this.okPressed = true;
  }
}
