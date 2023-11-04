import type { JsonEntityStorage } from '../index';
import { JsonDataProvider } from '../index';
export declare class JsonEntityFileStorage implements JsonEntityStorage {
    private folderPath;
    getItem(entityDbName: string): string;
    setItem(entityDbName: string, json: string): void;
    constructor(folderPath: string);
}
export declare class JsonFileDataProvider extends JsonDataProvider {
    constructor(folderPath: string);
}
