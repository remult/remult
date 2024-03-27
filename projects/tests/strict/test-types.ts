import {
  Entity,
  EntityBase,
  Fields,
  FieldsRef,
  Validators,
  repo,
} from '../../../dist/remult'

class E extends EntityBase {
  a = ''
}

const x: EntityBase = new E()

@Entity('tasks', {
  allowApiCrud: true,
})
export class Task {
  id = 0
  @Fields.string({})
  title = ''

  completed = false
  createdAt?: Date

  @Fields.string<Task>({ allowNull: true, validate: Validators.required })
  nom2?: string
  // => Type 'Validator<any>' is not assignable to type 'FieldValidator<ValidationMessage<any, undefined> | undefined, string>' ...

  // if I do:
  @Fields.string<Task>({
    allowNull: true,
    validate: Validators.unique('Has to be Unique'),
  })
  nom3?: string
}
