import { dbLoader } from "../../column-interfaces";

export class DefaultStorage<dataType> implements dbLoader<dataType>{
    toDb(val: dataType) {
        return val;
    }
    fromDb(val: any): dataType {
        return val;
    }

}