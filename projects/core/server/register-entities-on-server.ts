import { SiteArea } from "./expressBridge";

import { createOldEntity, getEntitySettings } from "../src/remult3";
import { allEntities, Remult,excludeFromApi } from "../src/context";
import { DataApi } from "../src/data-api";
import { ClassType } from "../classType";


export function registerEntitiesOnServer(area: SiteArea) {
    let errors = '';
    //add Api Entries
    allEntities.forEach(e => {
        if (!(Reflect.getMetadata(excludeFromApi, e)))
            area.add(c => {
                return new DataApi(c.repo(e), c);
            });
    });
    if (errors.length > 0) {
        console.log('Security not set for:' + errors);
    }
}



