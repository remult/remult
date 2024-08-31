import type { EntityFilter, MembersOnly } from 'remult'

export declare type SelectFields<T> = Partial<
  Record<keyof MembersOnly<T>, true>
>
export declare type SelectNumericFields<T> = {
  [K in keyof T as T[K] extends number ? K : never]?: true
}

type AggregateOptions<
  T,
  GroupFields extends SelectFields<T>,
  SumFields extends SelectNumericFields<T>,
> = {
  groupBy?: GroupFields
  sum?: SumFields

  orderBy?: {
    [K in keyof GroupFields]?: 'asc' | 'desc'
  } & {
    [K in keyof SumFields]?: { sum: 'asc' | 'desc' }
  }
  where?: EntityFilter<T>
  //min,max,count distict,limit,page,where
}

type AggregateResult<
  T,
  GroupFields extends SelectFields<T>,
  SumFields extends SelectNumericFields<T>,
> = {
  [P in keyof T as GroupFields extends { [Q in P]: true }
    ? P
    : never]: P extends keyof T ? T[P] : never
} & {
  [P in keyof T as SumFields extends { [Q in P]: true }
    ? P
    : never]: P extends keyof T ? { sum: number } : never
} & { $count: number }
interface Repository<T> {
  aggregate<
    GroupFields extends SelectFields<T>,
    SumFields extends SelectNumericFields<T>,
  >(
    options: AggregateOptions<T, GroupFields, SumFields>,
  ): {} extends GroupFields
    ? AggregateResult<T, GroupFields, SumFields>
    : AggregateResult<T, GroupFields, SumFields>[]
}

class MyClass {
  a!: string
  b!: number
  c!: boolean
  d!: string
  e!: string
  f!: string
  city!: string
  country!: string
  region = ''
  salary = 0
  numberOfKids = 0
}
const repo: Repository<MyClass> = undefined!

{
  const r = repo.aggregate({
    groupBy: {
      a: true,
    },
  })
  r[0].a
  //@ts-expect-error - b was not selected
  r[0].b
}
{
  const r = repo.aggregate({ sum: { salary: true } })
  r.salary
  //@ts-expect-error - a was not selected
  r[0].a
}

repo.aggregate({
  sum: { salary: true, numberOfKids: true },
  //average: ['numberOfKids'],
  orderBy: {},
  where: {
    salary: { $ne: 1000 },
  },
}).salary
repo.aggregate({
  sum: { salary: true },
  groupBy: { city: true },
  orderBy: {
    city: 'asc',
    salary: {
      sum: 'asc',
    },
  },
  //@ts-expect-error a was not selected
})[0].a
