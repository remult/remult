import { SiteArea } from "./expressBridge";
import { UserInfo,allEntities, DataProviderFactory,ServerContext,ContextEntity,DataApi} from "radweb";

export function registerEntitiesOnServer(area: SiteArea<UserInfo>, dataProvider: DataProviderFactory) {
    let errors = '';
    //add Api Entries
    allEntities.forEach(e => {
        let x = new ServerContext().for(e).create();
        if (x instanceof ContextEntity) {
            let j = x;
            area.add(r => {
                let c = new ServerContext();
                c.setDataProvider(dataProvider);
                c.setReq(r);
                let y = j._getEntityApiSettings(c);
                if (y.allowRead === undefined)
                    errors += '\r\n' + j.__getName()
                return new DataApi(c.create(e), y);
            });
        }
    });
    if (errors.length > 0) {
        console.log('Security not set for:' + errors);
    }
}