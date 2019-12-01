import { SiteArea } from "./expressBridge";
import { UserInfo, allEntities, DataProvider, ServerContext, DataApi, Context, DataProviderFactoryBuilder } from "@remult/core";
import { isFunction } from "util";

export function registerEntitiesOnServer(area: SiteArea, dataProvider: DataProviderFactoryBuilder) {
    let errors = '';
    //add Api Entries
    allEntities.forEach(e => {
        let x = new ServerContext().for(e).create();

        let j = x;
        area.add(r => {
            let c = new ServerContext();
            c.setReq(r);

            c.setDataProvider((dataProvider)(c));

            let y = j._getEntityApiSettings(c);
            if (y.allowRead === undefined)
                errors += '\r\n' + j.__getName()
            return new DataApi(c.for(e), y);
        });

    });
    if (errors.length > 0) {
        console.log('Security not set for:' + errors);
    }
}
