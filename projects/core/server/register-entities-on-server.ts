import { SiteArea } from "./expressBridge";

import { getEntityKey } from "../src/remult3";
import { allEntities } from "../src/context";
import { DataApi } from "../src/data-api";
import { ClassType } from "../classType";


export function registerEntitiesOnServer(area: SiteArea, entities?: ClassType<any>[]) {
    if (!entities)
        entities = allEntities;
    //add Api Entries
    entities.forEach(e => {
        let key = getEntityKey(e);
        if (key != undefined)
            area.add(key, c => {
                return new DataApi(c.repo(e), c);
            });
    });
}



