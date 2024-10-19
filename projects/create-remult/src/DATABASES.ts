import type { ComponentInfo } from "./utils/prepareInfoReadmeAndHomepage";
import type { Import } from "./utils/writeImports";

export const DATABASES = {
  json: {
    display: "JSON Files",
    url: "https://remult.dev/docs/quickstart#connecting-a-database",
    extraText: " (Used for dev, you can add a database later)",
    emoji: "💾",
    description: "Used for dev, you can add a database later",
  },
  postgres: {
    display: "Postgres",
    url: "https://www.postgresql.org/",
    emoji: "💾",
    description: "Powerful, open source object-relational database system",
    dependencies: {
      pg: "^8.3.0",
    },
    imports: [
      {
        from: "remult/postgres",
        imports: ["createPostgresDataProvider"],
      },
    ],
    code: `createPostgresDataProvider({
  connectionString: process.env["DATABASE_URL"]    
})`,
  },
  mysql: {
    url: "https://www.mysql.com/",
    display: "MySQL",
    emoji: "💾",
    description: "Powerful, database system",
    dependencies: {
      knex: "^3.1.0",
      mysql2: "^3.9.8",
    },
    imports: [
      {
        from: "remult/remult-knex",
        imports: ["createKnexDataProvider"],
      },
    ],
    code: `createKnexDataProvider({
  client: "mysql2",
  connection: {
    host: process.env["MYSQL_HOST"],
    database: process.env["MYSQL_DATABASE"],
    user: process.env["MYSQL_USER"],
    password: process.env["MYSQL_PASSWORD"],
    port: process.env["MYSQL_PORT"] ? Number(process.env["MYSQL_PORT"]) : undefined,
  },
})`,
  },
  mongodb: {
    url: "https://www.mongodb.com/",
    display: "MongoDB",
    emoji: "💾",
    description: "Powerful, database system",
    dependencies: {
      mongodb: "^4.17.1",
    },
    imports: [
      {
        from: "mongodb",
        imports: ["MongoClient"],
      },
      {
        from: "remult/remult-mongo",
        imports: ["MongoDataProvider"],
      },
    ],
    code: `async () => {
  const client = new MongoClient(process.env["MONGO_URL"]!)
  await client.connect()
  return new MongoDataProvider(client.db(process.env["MONGO_DB"]), client)
}`,
  },
  bettersqlite3: {
    display: "Better SQLite3",
    url: "https://www.npmjs.com/package/better-sqlite3",
    emoji: "💾",
    description: "Powerful, database system",
    dependencies: {
      "better-sqlite3": "^9.1.1",
    },
    devDependencies: {
      "@types/better-sqlite3": "^7.6.11",
    },
    imports: [
      {
        from: "remult",
        imports: ["SqlDatabase"],
      },
      {
        from: "better-sqlite3",
        imports: "Database",
      },
      {
        from: "remult/remult-better-sqlite3",
        imports: ["BetterSqlite3DataProvider"],
      },
    ],
    code: `new SqlDatabase( 
  new BetterSqlite3DataProvider(new Database('./mydb.sqlite')), 
)`,
  },
  sqlite3: {
    display: "SQLite3",
    url: "https://www.npmjs.com/package/sqlite3",
    emoji: "💾",
    description: "Powerful, database system",
    dependencies: {
      sqlite3: "^5.1.7",
    },
    devDependencies: {
      "@types/sqlite3": "^3.1.11",
    },
    imports: [
      {
        from: "remult",
        imports: ["SqlDatabase"],
      },
      {
        from: "sqlite3",
        imports: "sqlite3",
      },
      {
        from: "remult/remult-sqlite3",
        imports: ["Sqlite3DataProvider "],
      },
    ],
    code: `new SqlDatabase( 
  new Sqlite3DataProvider (new sqlite3.Database('./mydb.sqlite')), 
)`,
  },
  mssql: {
    display: "MSSQL",
    url: "https://www.microsoft.com/en-us/sql-server",
    emoji: "💾",
    description: "Powerful, database system",
    dependencies: {
      tedious: "^18.2.0",
      knex: "^3.1.0",
    },
    imports: [
      {
        from: "remult/remult-knex",
        imports: ["createKnexDataProvider"],
      },
    ],
    code: `createKnexDataProvider({
  client: "mssql",
  connection: {
    server: process.env["MSSQL_SERVER"],
    database: process.env["MSSQL_DATABASE"],
    user: process.env["MSSQL_USER"],
    password: process.env["MSSQL_PASSWORD"],
    options: {
      enableArithAbort: true,
      encrypt: false,
      instanceName: process.env["MSSQL_INSTANCE"],
    },
  }
})`,
  },
} satisfies Record<string, DatabaseType>;

export const databaseTypes = Object.keys(
  DATABASES,
) as (keyof typeof DATABASES)[];

export type DatabaseType = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  imports?: Import[];
  code?: string;
  extraText?: string;
} & ComponentInfo;
