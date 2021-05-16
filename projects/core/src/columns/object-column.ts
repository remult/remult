
import { dbLoader } from "../column-interfaces";
class TagStorage implements dbLoader<any>{
    toDb(val: any) {
        return JSON.stringify(val);
    }
    fromDb(val: any): string[] {
        if (val && val.toString().length > 0)
            return JSON.parse(val);
        return undefined;
    }

}
