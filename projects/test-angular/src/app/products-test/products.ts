
import { Allowed, BackendMethod, Remult, EntityOptions, Filter, IdEntity, FieldType, Entity, Field, Fields } from 'remult';




@FieldType<GroupsValue>({
  valueConverter: {
    toJson: x => x ? x.value : '',
    fromJson: x => new GroupsValue(x)
  },

})

export class GroupsValue {
  replace(val: string) {
    this.value = val;
  }
  constructor(private value: string) {

  }
}

@Entity("Products", {
  allowApiCrud: true,
  sqlExpression: async () =>
    new Promise(res => setTimeout(() => {
      res('Products')
    }, 10))

})
export class Products extends IdEntity {
  @Fields.String()
  name: string;
  @Fields.Number()
  price: number = 0;//= extend(new NumberColumn({ decimalDigits: 2, key: 'price_1' })).dataControl(x => x.getValue = () => this.price.value);
  @Fields.Number()
  categoryCode: number;
  @Fields.Date() // should be Date
  availableFrom1: Date;
  @Fields.Date()
  availableTo: Date;
  @Fields.Boolean()
  archive: boolean;
  static filter = Filter.createCustom<Products>(() => ({ name: "a" }));

  @BackendMethod({ allowed: true })
  async doit() {
    await this._.save();
  }
}

