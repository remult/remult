import { Entity, EntityBase, Field, FieldType, Fields } from '../../core/'

@FieldType<h>({
  valueConverter: {
    toJson: (x) => (x != undefined ? x : ''),
    fromJson: (x) => (x ? x : null),
  },
})
@Entity<h>('h', {
  saving: async (self) => {
    if (self.refH) {
      await self.$.refH.load()
      self.refHId = self.refH.id
    } else self.refHId = ''
  },
  allowApiCrud: true,
})
export class h extends EntityBase {
  @Fields.string()
  id: string
  @Field(() => h)
  refH: h
  @Fields.string()
  refHId: string
}
