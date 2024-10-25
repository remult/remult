<script setup>
  import Icon from '../../../components/Icon.vue'
</script>

# Choose a Database

By default, if no database provider is specified, Remult will use a simple JSON file-based database. This will store your data in JSON files located in the `db` folder at the root of your project.

<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 5rem; margin-top: 2rem">
	<Icon tech="json" sizeIco=150 link="/docs/installation/database/json" />
	<Icon tech="postgres" sizeIco=150 link="/docs/installation/database/postgresql" />
	<Icon tech="mysql" sizeIco=150 link="/docs/installation/database/mysql" />
	<Icon tech="mongodb" sizeIco=150 link="/docs/installation/database/mongodb" />
	<Icon tech="sqlite" sizeIco=150 link="/docs/installation/database/better-sqlite3" />
	<Icon tech="mssql" sizeIco=150 link="/docs/installation/database/mssql" />
	<Icon tech="bun" sizeIco=150 link="/docs/installation/database/bun-sqlite" />
	<Icon tech="sqljs" sizeIco=150 link="/docs/installation/database/sqljs" />
	<Icon tech="turso" sizeIco=150 link="/docs/installation/database/turso" />
	<Icon tech="duckdb" sizeIco=150 link="/docs/installation/database/duckdb" />
	<Icon tech="oracle" sizeIco=150 link="/docs/installation/database/oracle" />
</div>
