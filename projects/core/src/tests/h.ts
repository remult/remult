import { Field, Entity, EntityBase, FieldType } from '../remult3';



@FieldType<h>({
    valueConverter: {
        toJson: x => x != undefined ? x : '',
        fromJson: x => x ? x : null
    },
})
@Entity<h>('h', {
    saving: self => {
        if (self.refH)
            self.refHId = self.refH.id;

        else
            self.refHId = '';
    },
    allowApiCrud: true
})
export class h extends EntityBase {
    @Field()
    id: string;
    @Field()
    refH: h;
    @Field()
    refHId: string;
}
