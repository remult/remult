import { Fields } from '../../../../../core/index.js'
import { AccountManager } from './AccountManager.entity.js'

export class AccountManagerExtra extends AccountManager {
  @Fields.string()
  email2 = ''
}
