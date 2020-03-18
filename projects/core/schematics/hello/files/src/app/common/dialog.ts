import { Injectable, NgZone } from "@angular/core";
import {  MatSnackBar } from "@angular/material/snack-bar";
import {  Context } from "@remult/core";

import {  YesNoQuestionComponent } from "./yes-no-question/yes-no-question.component";






@Injectable()
export class DialogService {
    Info(info: string): any {
        this.snackBar.open(info, "close", { duration: 4000 });
    }
    Error(err: string): any {

        this.YesNoQuestion(err);
    }
    private mediaMatcher: MediaQueryList = matchMedia(`(max-width: 720px)`);


    isScreenSmall() {
        return this.mediaMatcher.matches;
    }

    


    constructor(private context:Context, zone: NgZone, private snackBar: MatSnackBar) {
        this.mediaMatcher.addListener(mql => zone.run(() => /*this.mediaMatcher = mql*/"".toString() ));


    }
    
    async YesNoQuestion(question: string) {
        return await this.context.openDialog(YesNoQuestionComponent,d=>d.setMessage(question),d=>d.okPressed);
    }
    async confirmDelete(of: string) {
        return await this.YesNoQuestion("Are you sure you would like to delete " + of + "?");
    }
}