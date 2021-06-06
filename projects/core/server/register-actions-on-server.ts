import { SiteArea } from "./expressBridge";
import { myServerAction, serverActionField, actionInfo } from '../src/server-action';

export function registerActionsOnServer(area: SiteArea) {
    var addAction = (a: any) => {
        let x = <myServerAction>a[serverActionField];
        if (!x) {
            throw 'failed to set server action, did you forget the ServerFunctionDecorator?';
        }
        
        area.addAction(x);
    };
    actionInfo.runningOnServer = true;
    actionInfo.allActions.forEach((a: any) => {
        addAction(a);
    });

}
