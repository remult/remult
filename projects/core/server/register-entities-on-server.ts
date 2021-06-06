import { SiteArea } from "./expressBridge";
import { ServerContext,  DataProviderFactoryBuilder } from "../";
import { createOldEntity, getEntityOptions } from "../src/remult3";
import { allEntities } from "../src/context";
import { DataApi } from "../src/data-api";


export function registerEntitiesOnServer(area: SiteArea) {
    let errors = '';
    //add Api Entries
    allEntities.forEach(e => {
        if (!(getEntityOptions(e).includeInApi === false))
            area.add(c => {
                return new DataApi(c.for(e));
            });

    });
    if (errors.length > 0) {
        console.log('Security not set for:' + errors);
    }
}
