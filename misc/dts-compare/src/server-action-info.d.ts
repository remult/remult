export declare const actionInfo: {
    allActions: any[];
    runningOnServer: boolean;
    runActionWithoutBlockingUI: <T>(what: () => Promise<T>) => Promise<T>;
    startBusyWithProgress: () => {
        progress: (percent: number) => void;
        close: () => void;
    };
};
export declare const serverActionField: unique symbol;
