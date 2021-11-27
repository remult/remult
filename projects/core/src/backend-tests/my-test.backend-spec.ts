import { IdEntity } from "../..";
import { Remult } from "../context";
import { Entity, Field } from "../remult3";
import { KnexDataProvider } from '../../remult-knex';
import * as Knex from 'knex';
import { config } from 'dotenv';
config();

describe("test", () => {
    let remult: Remult;
    let knex: Knex.Knex;
    beforeAll(async () => {
        knex =
            Knex.default({
                client: 'pg',
                connection: process.env.DATABASE_URL
            });
        remult = new Remult(new KnexDataProvider(knex));

    });
  

});


