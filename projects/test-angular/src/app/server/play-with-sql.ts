import { dbNamesOf, Entity, Field, Fields, Filter, remult, SqlDatabase, WebSqlDataProvider } from "remult";
import { KnexDataProvider } from "../../../../core/remult-knex";
import { Products } from "../products-test/products";
import { Task } from "./Task";
import { MongoDataProvider } from 'remult/remult-mongo'
import { PostgresDataProvider } from "../../../../core/postgres";

@Entity("customers", { allowApiCrud: true })
export class Customer {
  @Fields.uuid()
  id!: string;
  @Fields.string()
  name = '';
  @Fields.string()
  city = '';
}

@Entity("orders", { allowApiCrud: true })
export class Order {
  @Fields.uuid()
  id!: string;
  @Field(() => Customer)
  customer!: Customer
  @Fields.number()
  amount = 0;
  static filterCity = Filter.createCustom<Order, { city: string }>(
    async ({ city }) => {
      const orders = await dbNamesOf(Order);
      const customers = await dbNamesOf(Customer);
      return SqlDatabase.customFilter(
        async whereFragment => {
          whereFragment.sql =
            `${orders.customer} in 
               (select ${customers.id} 
                  from ${customers} 
                 where ${await whereFragment.sqlCondition(Customer, { city })})`
        });
    });
  @Fields.string({
    sqlExpression: async () => {
      const order = await dbNamesOf(Order);
      const customer = await dbNamesOf(Customer);
      return `(
          select ${customer.city}
            from ${customer}
           where ${customer.id} = ${order.customer}
          )`;
    }
  })
  city = '';
}


export async function seed() {
  const customerRepo = remult.repo(Customer);
  if (await customerRepo.count() === 0) {
    const customers = await customerRepo.insert([
      { name: 'Fay, Ebert and Sporer', city: 'London' },
      { name: 'Abshire Inc', city: 'New York' },
      { name: 'Larkin - Fadel', city: 'London' }])
    await remult.repo(Order).insert([
      { customer: customers[0], amount: 10 },
      { customer: customers[0], amount: 15 },
      { customer: customers[1], amount: 40 },
      { customer: customers[1], amount: 5 },
      { customer: customers[1], amount: 7 },
      { customer: customers[2], amount: 90 },
      { customer: customers[2], amount: 3 }])
  }
  try {
    const tasks = await dbNamesOf(Task);
    const sql = WebSqlDataProvider.getDb();
    sql.transaction(y => {
      y.executeSql(`select count(*) as c from ${tasks}`, undefined,
        (_, r) => {
          console.log(r.rows[0].c);
        });
    });
  } catch (err) {
    console.error(err);
  }


}
