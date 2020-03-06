import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';




@Component({
  selector: 'app-yes-no-question',
  templateUrl: './yes-no-question.component.html',
  styleUrls: ['./yes-no-question.component.scss']
})
export class YesNoQuestionComponent implements OnInit {
  okPressed = false;
  setMessage(question: string, yesNoQuestion = true): void {
    this.message = question;
    this.showOk = yesNoQuestion;
  }
  message: string;
  showOk: boolean;

  constructor(
    private dialogRef: MatDialogRef<any>) {

  }

  ngOnInit() {
  }
  close() {
    this.dialogRef.close();
  }
  select() {
    this.dialogRef.close();
    this.okPressed = true;
  }
}
