<script setup>
  import Icon from '../../../components/Icon.vue'
</script>

# Choose a Database

By default, if no database provider is specified, Remult will use a simple JSON file-based database. This will store your data in JSON files located in the `db` folder at the root of your project.

<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 5rem; margin-top: 2rem">
	<Icon tech="postgres" sizeIco=100 link="/docs/installation/database/postgresql" />
	<Icon tech="mysql" sizeIco=100 link="/docs/installation/database/mysql" />
	<Icon tech="mongodb" sizeIco=100 link="/docs/installation/database/mongodb" />
	<Icon tech="sqlite" sizeIco=100 link="/docs/installation/database/better-sqlite3" />
	<Icon tech="sqljs" sizeIco=100 link="/docs/installation/database/sqljs" />
	<Icon tech="mssql" sizeIco=100 link="/docs/installation/database/mssql" />
	<Icon tech="bun-sqlite" sizeIco=100 link="/docs/installation/database/bun-sqlite" />
	<Icon tech="turso" sizeIco=100 link="/docs/installation/database/turso" />
	<Icon tech="duckdb" sizeIco=100 link="/docs/installation/database/duckdb" />
	<Icon tech="oracle" sizeIco=100 link="/docs/installation/database/oracle" />
	<Icon tech="json files" sizeIco=100 link="/docs/installation/database/json" />
</div>
