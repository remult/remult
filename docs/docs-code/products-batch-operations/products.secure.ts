import { IdEntity, Field, Entity, DateOnlyField } from 'remult';
import { Roles } from '../users/roles';
@Entity('Products', {
    allowApiCrud: Roles.admin,
    allowApiRead: true
})
export class Products extends IdEntity {
    @Field()
    name: string;
    @Field()
    price: number = 0;
    @DateOnlyField()
    availableFrom: Date;
    @DateOnlyField()
    availableTo: Date;
}
