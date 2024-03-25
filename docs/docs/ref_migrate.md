# migrate
Applies migration scripts to update the database schema.
   
   
   #### see:
   [Migrations](http://remult.dev/docs/migrations.html)

Arguments:
* **options** - Configuration options for applying migrations.
   * **migrations** - An object containing the migration scripts, each keyed by a unique identifier.
   * **dataProvider** - The data provider instance or a function returning a promise of the data provider.
   * **migrationsTable** - (Optional) The name of the table that tracks applied migrations. Default is '__remult_migrations_version'.
   * **endConnection** - (Optional) Determines whether to close the database connection after applying migrations. Default is true.
