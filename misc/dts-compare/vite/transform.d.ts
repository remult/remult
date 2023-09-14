export declare const transform: (code: string) => Promise<{
    transformed: boolean;
    code: string;
    map?: any;
    toString(): string;
}>;
