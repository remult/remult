import { SiteArea } from "./expressBridge";
import { myServerAction, serverActionField, actionInfo, classBackendMethodsArray } from '../src/server-action';
import { ClassType } from "../classType";

export function registerActionsOnServer(area: SiteArea, controllers?: ClassType<any>[]) {
    var addAction = (a: any) => {
        let x = <myServerAction>a[serverActionField];
        if (!x) {
            throw 'failed to set server action, did you forget the BackendMethod Decorator?';
        }

        area.addAction(x);
    };
    actionInfo.runningOnServer = true;
    if (controllers && controllers.length > 0) {
        for (const c of controllers) {
            let z = c[classBackendMethodsArray];
            if (z)
                for (const a of z) {
                    addAction(a);
                }
        }
    } else
        actionInfo.allActions.forEach((a: any) => {
            addAction(a);
        });
}
