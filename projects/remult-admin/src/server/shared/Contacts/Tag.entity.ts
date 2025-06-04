import {
  Allow,
  BackendMethod,
  Entity,
  Fields,
  Validators,
  remult,
} from '../../../../../core/index.js'

@Entity('tags', {
  // allowApiCrud: Allow.authenticated,
  allowApiCrud: true,
})
export class Tag {
  @Fields.uuid()
  id?: string
  @Fields.string()
  tag = ''
  @Fields.string({ inputType: 'color' })
  color = ''
  // For error testing
  // @Fields.string({
  //   serverExpression: () => {
  //     throw new Error('returning an error from serverExpression')
  //   }
  // })
  // serverInfo = 'info'
}

export const colors = [
  '#eddcd2',
  '#fff1e6',
  '#fde2e4',
  '#fad2e1',
  '#c5dedd',
  '#dbe7e4',
  '#f0efeb',
  '#d6e2e9',
  '#bcd4e6',
  '#99c1de',
]
