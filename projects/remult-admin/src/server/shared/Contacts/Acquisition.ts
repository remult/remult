import { ValueListFieldType } from '../../../../../core/index.js'

@ValueListFieldType()
export class Acquisition {
  static inbound = new Acquisition()
  static outbound = new Acquisition()
  id!: string
  caption!: string
}
