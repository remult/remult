import { ColumnStorage } from "../../column-interfaces";

export class DefaultStorage<dataType> implements ColumnStorage<dataType>{
    toDb(val: dataType) {
        return val;
    }
    fromDb(val: any): dataType {
        return val;
    }

}