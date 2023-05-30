import { SqlDatabase, remult } from 'remult'

export async function getEntityTypescriptPostgres(
  table: string,
  schema = 'public'
) {
  const command = SqlDatabase.getDb(remult).createCommand()

  let cols = ''
  let props = []
  props.push('allowApiCrud: true')
  if (table.toLocaleLowerCase() != table) {
    //  props.push("dbName: '\"" + table + "\"'");
  }

  let first: string = undefined!
  for (const {
    column_name,
    column_default,
    data_type,
    datetime_precision,
    character_maximum_length
  } of (
    await command.execute(
      `select * from INFORMATION_SCHEMA.COLUMNS where table_schema=${command.addParameterAndReturnSqlToken(
        schema
      )} and table_name=${command.addParameterAndReturnSqlToken(table)}
      
      order by ordinal_position`
    )
  ).rows) {
    let decorator = '@Fields.string'
    let decoratorArgs = ''

    let type = ''
    let defaultVal = "''"
    switch (data_type) {
      case 'decimal':
      case 'real':
      case 'int':
      case 'smallint':
      case 'tinyint':
      case 'bigint':
      case 'float':
      case 'numeric':
      case 'NUMBER':
      case 'money':
        if (datetime_precision === 0) decorator = '@Fields.integer'
        else decorator = '@Fields.number'
        defaultVal = '0'
        break
      case 'nchar':
      case 'nvarchar':
      case 'ntext':
      case 'NVARCHAR2':
      case 'text':
      case 'varchar':
      case 'VARCHAR2':
        break
      case 'char':
      case 'CHAR':
        console.log({
          character_maximum_length,
          column_default,
          data_type,
          column_name
        })
        if (character_maximum_length == 8 && column_default == "('00000000')") {
          decorator = '@Fields.dateOnly'
          type = 'Date'
        }
        break
      case 'DATE':
      case 'datetime':
      case 'datetime2':
      case 'timestamp without time zone':
        decorator = '@Fields.date'
        type = 'Date'
        break
      case 'bit':
        decorator = '@Fields.boolean'
        break
      default:
        console.log(data_type)
        break
    }

    if (
      column_name.toLocaleLowerCase() != column_name ||
      column_name == 'order'
    )
      decoratorArgs = `{ dbName: '"${column_name}"' }`
    if (!first) first = column_name
    cols += '\n\n  ' + decorator + `(${decoratorArgs})\n  ` + column_name
    if (!defaultVal) {
      cols += '!'
      cols += ': '
      cols += type
    }
    if (defaultVal) cols += ' = ' + defaultVal
  }
  // props.push(`defaultOrderBy: { ${first}: "asc" }`)
  let r =
    `import { Entity, Fields, EntityBase } from "remult";
@Entity<${table}>("${table}", { \n  ${props.join(',\n  ')} \n})
export class ${table} extends EntityBase {` +
    cols +
    '\n}'.replace('  ', '')
  return r
}
