import { ColumnStorage } from "../../dataInterfaces1";

export class DefaultStorage<dataType> implements ColumnStorage<dataType>{
    toDb(val: dataType) {
        return val;
    }
    fromDb(val: any): dataType {
        return val;
    }

}