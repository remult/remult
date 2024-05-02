import type { Repository } from 'remult'

export function repoResolver<entityType>(repo: Repository<entityType>) {
  return async (values: entityType) => {
    const errors = await repo.validate(values)
    if (errors && errors.modelState)
      return {
        values,
        errors: Object.fromEntries(
          Object.entries(errors.modelState).map(([key, value]) => [
            key,
            { message: value },
          ]),
        ),
      }
    return { values, errors: {} }
  }
}
