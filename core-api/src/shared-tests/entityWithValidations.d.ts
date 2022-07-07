import { ClassType } from '../../classType';
import { Remult } from '../context';
import { EntityBase, Repository } from '../remult3';
export declare var testConfiguration: {
    restDbRunningOnServer: boolean;
};
export declare class entityWithValidations extends EntityBase {
    private remult;
    myId: number;
    name: string;
    static savingRowCount: number;
    constructor(remult: Remult);
    static create4RowsInDp(createEntity: (entity: ClassType<any>) => Promise<Repository<entityWithValidations>>): Promise<Repository<entityWithValidations>>;
}
