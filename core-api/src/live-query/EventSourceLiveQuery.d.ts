import { LiveQueryClient } from './LiveQuery';
export declare class EventSourceLiveQuery extends LiveQueryClient {
    private wrapMessage?;
    constructor(wrapMessage?: (what: () => void) => void);
}
