import { Injectable, NgZone, ErrorHandler } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Context } from "@remult/core";

import { YesNoQuestionComponent } from "./yes-no-question/yes-no-question.component";
import { isString } from 'util';






@Injectable()
export class DialogService {
    info(info: string): any {
        this.snackBar.open(info, "close", { duration: 4000 });
    }
    async error(err: any) {

        return await this.context.openDialog(YesNoQuestionComponent, d => d.args = {
            message: extractError(err),
            isAQuestion: false
        });
    }
    private mediaMatcher: MediaQueryList = matchMedia(`(max-width: 720px)`);


    isScreenSmall() {
        return this.mediaMatcher.matches;
    }

    constructor(private context: Context, zone: NgZone, private snackBar: MatSnackBar) {
        this.mediaMatcher.addListener(mql => zone.run(() => /*this.mediaMatcher = mql*/"".toString()));


    }

    async yesNoQuestion(question: string) {
        return await this.context.openDialog(YesNoQuestionComponent, d => d.args = { message: question }, d => d.okPressed);
    }
    async confirmDelete(of: string) {
        return await this.yesNoQuestion("Are you sure you would like to delete " + of + "?");
    }
}
@Injectable()
export class ShowDialogOnErrorErrorHandler extends ErrorHandler {
    constructor(private dialog: DialogService, private zone: NgZone) {
        super();
    }
    lastErrorString: '';
    lastErrorTime: number;
    async handleError(error) {
        super.handleError(error);
        if (this.lastErrorString == error.toString() && new Date().valueOf() - this.lastErrorTime < 100)
            return;
        this.lastErrorString = error.toString();
        this.lastErrorTime = new Date().valueOf();
        this.zone.run(() => {
            this.dialog.error(error);
        });

    }
}


export function extractError(err: any) {
    if (isString(err))
        return err;
    if (err.modelState) {
        if (err.message)
            return err.message;
        for (const key in err.modelState) {
            if (err.modelState.hasOwnProperty(key)) {
                const element = err.modelState[key];
                return key + ": " + element;

            }
        }
    }
    if (err.rejection)
        return extractError(err.rejection);//for promise failed errors and http errors
    if (err.message) {
        let r = err.message;
        if (err.error && err.error.message)
            r =  err.error.message;
        return r;
    }
    if (err.error)
        return extractError(err.error);


    return JSON.stringify(err);
}
