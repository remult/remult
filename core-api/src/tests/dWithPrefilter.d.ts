import { EntityBase } from '../remult3';
export declare class dWithPrefilter extends EntityBase {
    id: number;
    b: number;
    static count: number;
    doIt(): Promise<boolean>;
}
