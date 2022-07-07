export declare class UrlBuilder {
    url: string;
    constructor(url: string);
    add(key: string, value: any): void;
    addObject(object: any, suffix?: string): void;
}
