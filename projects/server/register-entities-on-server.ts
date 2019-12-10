import { SiteArea } from "./expressBridge";
import { allEntities, ServerContext, DataApi, DataProviderFactoryBuilder } from "@remult/core";


export function registerEntitiesOnServer(area: SiteArea, dataProvider: DataProviderFactoryBuilder) {
    let errors = '';
    //add Api Entries
    allEntities.forEach(e => {
        let x = new ServerContext().for(e).create();
        area.add(r => {
            let c = new ServerContext();
            c.setReq(r);

            c.setDataProvider((dataProvider)(c));
            let ep = c.for(e);
            let t = ep.create();
            let y = t._getEntityApiSettings(c);
            if (y.allowRead === undefined)
                errors += '\r\n' + x.__getName()
            return new DataApi(ep, y, t);
        });

    });
    if (errors.length > 0) {
        console.log('Security not set for:' + errors);
    }
}
