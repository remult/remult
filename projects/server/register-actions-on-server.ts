import { SiteArea } from "./expressBridge";
import {  myServerAction, serverActionField,actionInfo, DataProviderFactoryBuilder } from '@remult/core';

export function registerActionsOnServer(area: SiteArea, dataProvider:  DataProviderFactoryBuilder) {
    var addAction = (a: any) => {
        let x = <myServerAction>a[serverActionField];
        if (!x) {
            throw 'failed to set server action, did you forget the ServerFunctionDecorator?';
        }
        x.dataProvider = dataProvider;
        area.addAction(x);
    };
    actionInfo.runningOnServer = true;
    actionInfo.allActions.forEach((a:any) => {
        addAction(a);
    });

}