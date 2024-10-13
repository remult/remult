# Offline Support

In modern web applications, providing a seamless user experience often involves enabling offline functionality. This ensures that users can continue to interact with the application even without an active internet connection. Remult supports several offline databases that can be used to store data in the browser for offline scenarios, enhancing the application's resilience and usability.

## Using Local Database for Specific Calls

To utilize a local database for a specific call, you can pass the `dataProvider` as a second parameter to the `repo` function. This allows you to specify which database should be used for that particular operation.

```typescript
import { localDb } from './some-file.ts'

console.table(await repo(Task, localDb).find())
```

In this example, `localDb` is used as the data provider for the `Task` repository, enabling data fetching from the local database.

## JSON in LocalStorage / SessionStorage

For simple data storage needs, you can use JSON data providers that leverage the browser's `localStorage` or `sessionStorage`.

```typescript
import { JsonDataProvider, Remult } from 'remult'
export const remultLocalStorage = new Remult(new JsonDataProvider(localStorage))
```

This approach is straightforward and suitable for small datasets that need to persist across sessions or page reloads.

## JSON Storage in IndexedDB

For more complex offline storage needs, such as larger datasets and structured queries, `IndexedDB` provides a robust solution. Using Remult’s `JsonEntityIndexedDbStorage`, you can store entities in `IndexedDB`, which is supported across all major browsers. This allows for efficient offline data management while offering support for larger volumes of data compared to `localStorage` or `sessionStorage`.

```typescript
import { JsonDataProvider } from 'remult'
import { JsonEntityIndexedDbStorage } from 'remult'

// Initialize the JsonEntityIndexedDbStorage
const db = new JsonDataProvider(new JsonEntityIndexedDbStorage())

// Use the local IndexedDB to store and fetch tasks
console.table(await repo(Task, db).find())
```

In this example, `JsonEntityIndexedDbStorage` is used to persist the data to `IndexedDB`. This method is ideal for applications with large data sets or those requiring more complex interactions with the stored data in offline mode.

## JSON Storage in OPFS (Origin Private File System)

Origin Private File System (OPFS) is a modern browser feature supported by Chrome and Safari, allowing for more structured and efficient data storage in the frontend.

```typescript
import { JsonDataProvider } from 'remult'
import { JsonEntityOpfsStorage } from 'remult'

const localDb = new JsonDataProvider(new JsonEntityOpfsStorage())
```

Using OPFS with Remult's `JsonDataProvider` provides a robust solution for storing entities in the frontend, especially for applications requiring more complex data handling than what `localStorage` or `sessionStorage` can offer.

Certainly! Here's the adjusted section on `sql.js` with an enriched code sample:

## `sql.js`: A SQLite Implementation for the Frontend

For applications requiring advanced database functionality, [`sql.js`](https://sql.js.org/) provides a SQLite implementation that runs entirely in the frontend. This allows you to use SQL queries and transactions, offering a powerful and flexible data management solution for offline scenarios.

Before using `sql.js` in your project, you need to install the package and its TypeScript definitions. Run the following commands in your terminal:

```bash
npm install sql.js
npm install @types/sql.js --save-dev
```

After installing the necessary packages, you can use the following code sample in your project:

```typescript
import { SqlDatabase } from 'remult'
import { SqlJsDataProvider } from 'remult/remult-sql-js'
import initSqlJs from 'sql.js'

let sqlDb: Database
// Initialize the SqlJsDataProvider with a new database instance
const sqlJsDataProvider = new SqlJsDataProvider(
  initSqlJs({
    locateFile: (file) => `https://sql.js.org/dist/${file}`, // for complete offline support, change this to a url that is available offline
  }).then((x) => {
    // Load the database from localStorage if it exists
    const dbData = localStorage.getItem('sqljs-db')
    if (dbData) {
      const buffer = new Uint8Array(JSON.parse(dbData))
      return (sqlDb = new x.Database(buffer))
    }
    return (sqlDb = new x.Database())
  }),
)

// Set up an afterMutation hook to save the database to localStorage after any mutation
sqlJsDataProvider.afterMutation = async () => {
  const db = sqlDb
  const buffer = db.export()

  localStorage.setItem('sqljs-db', JSON.stringify([...buffer]))
}
const localDb = new SqlDatabase(sqlJsDataProvider)
```

This code sets up a SQLite database using `sql.js` in your Remult project, with support for saving to and loading from `localStorage`.

## Summary

Remult's support for various offline databases empowers developers to create web applications that provide a seamless user experience, even in offline scenarios. Whether using simple JSON storage in `localStorage` or more advanced solutions like OPFS or `sql.js`, Remult offers the flexibility to choose the right data storage solution for your application's needs. By leveraging these offline capabilities, you can ensure that your application remains functional and responsive, regardless of the user's connectivity status.
