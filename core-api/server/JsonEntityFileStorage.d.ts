import { JsonEntityStorage } from '../index';
export declare class JsonEntityFileStorage implements JsonEntityStorage {
    private folderPath;
    getItem(entityDbName: string): string;
    setItem(entityDbName: string, json: string): void;
    constructor(folderPath: string);
}
