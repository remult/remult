import { Injectable, NgZone } from "@angular/core";
import { MatDialog, MatSnackBar } from "@angular/material";
import { Entity, IDataSettings } from "radweb";

import { YesNoQuestionComponentData, YesNoQuestionComponent } from "./yes-no-question/yes-no-question.component";

import { Subject } from "rxjs";
import { InputAreaComponentData, InputAreaComponent } from './input-area/input-area.component';
import { SelectComponentInfo, SelectPopupComponent } from './select-popup/select-popup.component';


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

    newsUpdate = new Subject<string>();


    constructor(private dialog: MatDialog, private zone: NgZone, private snackBar: MatSnackBar) {
        this.mediaMatcher.addListener(mql => zone.run(() => /*this.mediaMatcher = mql*/"".toString() ));


    }
    
    
    displayArea(settings: InputAreaComponentData) {
        this.dialog.open(InputAreaComponent, { data: settings });
    }
    showPopup<T extends Entity<any>>(entityType: { new(...args: any[]): T; }, selected: (selectedValue: T) => void, settings?: IDataSettings<T>) {

        let data: SelectComponentInfo<T> = {
            onSelect: selected,
            entity: entityType,
            settings: settings
        };
        let ref = this.dialog.open(SelectPopupComponent, {
            data
        });
    }
    YesNoQuestion(question: string, onYes?: () => void) {
        let data: YesNoQuestionComponentData = {
            question: question,
            onYes: onYes
        };
        this.dialog.open(YesNoQuestionComponent, { data });
    }
    confirmDelete(of: string, onOk: () => void) {
        this.YesNoQuestion("Are you sure you would like to delete " + of + "?", onOk);
    }
}
