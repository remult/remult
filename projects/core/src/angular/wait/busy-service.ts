import { Injectable } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material";

import { WaitComponent } from "./wait.component";
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from "@angular/common/http";
import { Observable } from "rxjs";
import { finalize } from "rxjs/operators";
// @dynamic
@Injectable()
export class BusyService {
    private waitRef: MatDialogRef<any>;
    async donotWait<t>(what: () => Promise<t>): Promise<t> {
        this.disableWait = true;
        try {
            return (await what());
        }
        finally {
            this.disableWait = false;
        }

    }
    donotWaitNonAsync<t>(what: () => t): t {
        this.disableWait = true;
        try {
            return ( what());
        }
        finally {
            this.disableWait = false;
        }

    }
    static singleInstance: BusyService;
    private id = 0;
    private numOfWaits = 0;
    private disableWait = false;
    log(id: number, what: string) {
        //console.log(what + ' id:' + this.id + ' w:' + this.numOfWaits);
    }
    constructor(private dialog: MatDialog) {
        BusyService.singleInstance = this;

        
    }
    async doWhileShowingBusy<t>(what: () => Promise<t>): Promise<t> {
        let x = this.showBusy();
        try {
            return await what();
        }
        finally {
            x();
        }
    }
    showBusy() {

        let id = this.id++;
        if (this.disableWait)
            return () => { };
        this.log(id, 'start busy ');
        if (this.numOfWaits == 0) {

            setTimeout(() => {

                if (this.numOfWaits > 0 && !this.waitRef) {
                    this.log(id, 'actual start busy ');
                    this.waitRef = this.dialog.open(WaitComponent, { disableClose: true });
                }
            }, 300);

        }
        this.numOfWaits++;

        return () => {
            this.numOfWaits--;
            this.log(id, 'close busy ');
            if (this.numOfWaits == 0) {
                this.log(id, 'close top busy ');
                if (this.waitRef) {
                    this.log(id, 'actual close top busy ');
                    this.waitRef.close();
                    this.waitRef = undefined;
                }
            }
        };
    }

}
@Injectable()
export class LoaderInterceptor implements HttpInterceptor {
    constructor(private busy: BusyService) {


    }
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let x = this.busy.showBusy();
        return next.handle(req).pipe(finalize(() => x()));
    }
}