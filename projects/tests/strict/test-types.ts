import {
  Entity,
  EntityBase,
  FieldOptions,
  FieldValidator,
  Fields,
  FieldsRef,
  Validators,
  repo,
} from 'remult'
import { entity } from '../tests/dynamic-classes.js'

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

  @Fields.string<Task>({
    allowNull: true,
    validate: Validators.minLength(3),
  })
  nom4?: string
}

function dateOnly<entityType = unknown>(o?: FieldOptions<entityType, Date>) {
  const validate: FieldValidator<entityType, Date>[] = []
  validate.push(Validators.required)
}

function string<entityType = unknown, valueType = string>() {
  const validate: FieldValidator<entityType, valueType>[] = []
  validate.push(Validators.required)
}



  class HelperBase extends EntityBase {
    @Fields.string()
    id = ''
  }
  class Helper extends HelperBase {
    @Fields.string()
    name = ''
  }
  var h: HelperBase = new Helper()
let a!:keyof HelperBase 
let b!:keyof Helper 
a=b;


