import { SiteArea } from "./expressBridge";

import { getEntityKey } from "../src/remult3";
import { allEntities } from "../src/context";
import { DataApi } from "../src/data-api";


export function registerEntitiesOnServer(area: SiteArea) {
    //add Api Entries
    allEntities.forEach(e => {
        let key = getEntityKey(e);
        if (key != undefined)
            area.add(key, c => {
                return new DataApi(c.repo(e), c);
            });
    });
}



