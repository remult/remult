export interface packedRowInfo {
    data: any;
    isNewRow: boolean;
    id: string;
    wasChanged: boolean;
}
export interface entityEventListener<entityType> {
    deleted?: (entity: entityType) => void;
    validating?: (entity: entityType) => Promise<any> | any;
}
