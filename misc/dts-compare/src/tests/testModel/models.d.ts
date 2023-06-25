export declare class Status {
    id: number;
    name: string;
    static open: Status;
    static closed: Status;
    static hold: Status;
    constructor(id: number, name: string);
}
export declare class TestStatus {
    id?: string;
    caption?: string;
    static open: TestStatus;
    static closed: TestStatus;
    static hold: TestStatus;
    constructor(id?: string, caption?: string);
}
