import { SiteArea } from "./expressBridge";
import { allEntities, ServerContext, DataApi, DataProviderFactoryBuilder } from "../";
import { createOldEntity } from "../src/remult3";


export function registerEntitiesOnServer(area: SiteArea, dataProvider: DataProviderFactoryBuilder) {
    let errors = '';
    //add Api Entries
    allEntities.forEach(e => {
        if (!(createOldEntity(e).entityInfo.includeInApi === false))
            area.add(r => {
                let c = new ServerContext();
                c.setReq(r);
                c.setDataProvider((dataProvider)(c));
                return new DataApi(c.for(e));
            });

    });
    if (errors.length > 0) {
        console.log('Security not set for:' + errors);
    }
}
