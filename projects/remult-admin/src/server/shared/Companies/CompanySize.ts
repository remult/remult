import { ValueListFieldType } from '../../../../../core/index.js'

@ValueListFieldType({
  getValues: () => [
    CompanySize.s1,
    new CompanySize(10, '2-9 employees'),
    new CompanySize(50, '10-49 employees'),
    new CompanySize(250, '50-249 employees'),
    new CompanySize(500, '250 or more employees'),
  ],
})
export class CompanySize {
  constructor(
    public id: number,
    public caption: string,
  ) {}
  static s1 = new CompanySize(1, '1 employee')
}
