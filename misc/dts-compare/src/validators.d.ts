import { FieldRef } from './remult3';
export declare class Validators {
    static required: ((entity: any, col: FieldRef<any, string>, message?: any) => void) & {
        withMessage: (message: string) => (entity: any, col: FieldRef<any, string>) => void;
        defaultMessage: string;
    };
    static unique: ((entity: any, col: FieldRef<any, any>, message?: any) => Promise<void>) & {
        withMessage: (message: string) => (entity: any, col: FieldRef<any, any>) => Promise<void>;
        defaultMessage: string;
    };
    static uniqueOnBackend: ((entity: any, col: FieldRef<any, any>, message?: any) => Promise<void>) & {
        withMessage: (message: string) => (entity: any, col: FieldRef<any, any>) => Promise<void>;
    };
}
