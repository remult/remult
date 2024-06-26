import { ValueListFieldType } from '../../../../../core/index.js'

@ValueListFieldType({
  getValues: () => [
    Status.cold,
    new Status('warm', '#e8cb7d'),
    new Status('hot', '#e88b7d'),
    new Status('in-contract', '#a4e87d'),
  ],
})
export class Status {
  static cold = new Status('cold', '#7dbde8')
  constructor(
    public id: string,
    public color: string,
    public caption?: string,
  ) {}
}
