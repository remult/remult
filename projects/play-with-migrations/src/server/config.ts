import { config } from 'dotenv'
import { createPostgresDataProvider } from 'remult/postgres'
import { Task } from '../shared/tasks.js'
import { KnexDataProvider } from '../../../core/remult-knex/index.js'
import Knex from 'knex'
config()

export const dataProvider = new KnexDataProvider(
  Knex({
    client: 'pg',
    connection: process.env.DATABASE_URL,
    //debug:true
  }),
)

createPostgresDataProvider({
  connectionString: process.env.DATABASE_URL,
})
export const entities = [Task]
