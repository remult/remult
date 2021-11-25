import { Remult } from "../context";
import { DataProvider } from "../data-interfaces";
import { InMemoryDataProvider } from "../data-providers/in-memory-database";


export function itWithFocus(key: string, what: () => Promise<void>, focus = false) {
    if (focus)
        fit(key, what);
    else
        it(key, what);
}
export function testAll(key: string, what: dbTestWhatSignature, focus = false) {
    for (const test of databasesTesters) {
        test(key, what, focus);
    }
    loadedTests.push(x => {
        x(key, what, focus);
    })
}
const databasesTesters = [] as dbTestMethodSignature[];
const loadedTests = [] as ((tested: dbTestMethodSignature) => void)[];
export function addDatabaseToTest(tester: dbTestMethodSignature) {
    for (const test of loadedTests) {
        test(tester);
    }
    databasesTesters.push(tester);
}



export function testInMemory(key: string, what: dbTestWhatSignature, focus = false) {
    itWithFocus(key + " - in memory", async () => {
        let remult = new Remult();
        let db = new InMemoryDataProvider();
        remult.setDataProvider(db);
        await what({ db, remult });
    }, focus);
}



databasesTesters.push(testInMemory);

export declare type dbTestWhatSignature = (db: {
    db: DataProvider,
    remult: Remult
}) => Promise<void>;
export declare type dbTestMethodSignature = (key: string, what: dbTestWhatSignature, focus: boolean) => void;


