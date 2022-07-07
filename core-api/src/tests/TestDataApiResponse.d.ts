import { DataApiResponse } from "../data-api";
export declare class TestDataApiResponse implements DataApiResponse {
    progress(progress: number): void;
    success(data: any): void;
    forbidden(): void;
    created(data: any): void;
    deleted(): void;
    notFound(): void;
    error(data: any): void;
}
