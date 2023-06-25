export declare class GroupsValue {
    private readonly value;
    hasAny(): boolean;
    constructor(value: string);
    evilGet(): string;
    listGroups(): string[];
    removeGroup(group: string): GroupsValue;
    addGroup(group: string): GroupsValue;
    selected(group: string): boolean;
}
