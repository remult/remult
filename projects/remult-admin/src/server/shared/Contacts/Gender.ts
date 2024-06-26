import { ValueListFieldType } from '../../../../../core/index.js'

@ValueListFieldType()
export class Gender {
  static male = new Gender()
  static female = new Gender()
  id!: string
  caption!: string
}
