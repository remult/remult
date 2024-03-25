# generateMigrations
Generates migration scripts based on changes in entities.
   
   
   #### see:
   [Migrations](http://remult.dev/docs/migrations.html)

Arguments:
* **options** - Configuration options for generating migrations.
   * **entities** - An array of entity classes to be included in the migration.
   * **dataProvider** - The data provider instance or a function returning a promise of the data provider.
   * **migrationsFolder** - (Optional) The path to the folder where migration scripts will be stored. Default is 'src/server/migrations'.
   * **snapshotFile** - (Optional) The path to the file where the snapshot of the last known state will be stored. Default is 'migrations-snapshot.json' in the `migrationsFolder`.
   * **migrationsTSFile** - (Optional) The path to the TypeScript file where the generated migrations will be written. Default is 'migrations.ts' in the `migrationsFolder`.
   * **endConnection** - (Optional) Determines whether to close the database connection after generating migrations. Default is true.
