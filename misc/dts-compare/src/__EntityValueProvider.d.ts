export interface packedRowInfo {
    data: any;
    isNewRow: boolean;
    id: string;
    wasChanged: boolean;
}
export interface entityEventListener<entityType> {
    deleted?: (entity: entityType) => void;
    saved?: (entity: entityType, isNew: boolean) => void;
    validating?: (entity: entityType) => Promise<any> | any;
}
