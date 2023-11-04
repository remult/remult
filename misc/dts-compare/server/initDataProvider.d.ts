import type { DataProvider } from '../src/data-interfaces';
export declare function initDataProvider(optionsDataProvider?: DataProvider | Promise<DataProvider> | (() => Promise<DataProvider | undefined>)): Promise<DataProvider>;
