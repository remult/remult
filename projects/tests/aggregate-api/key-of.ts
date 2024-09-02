import type { EntityFilter, Repository } from 'remult'

// Example usage:
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

repo.aggregate({ groupBy: ['a'] }).then((r) => {
  r[0].a
  //@ts-expect-error - b was not selected
  r[0].b
})

repo.aggregate({
  sum: ['b', 'numberOfKids', 'b'],
  groupBy: ['city'],
  avg: ['numberOfKids'],
  orderBy: {
    numberOfKids: {
      sum: 'asc',
    },
  },
})

repo
  .aggregate({
    sum: ['salary'],
    //average: ['numberOfKids'],

    where: {
      salary: { $ne: 1000 },
    },
  })
  .then((x) => x.salary)
repo
  .aggregate({
    sum: ['salary'],

    groupBy: ['city'],
    orderBy: {
      city: 'asc',
      salary: {
        sum: 'desc',
      }, //
    },
  })
  .then(
    (r) =>
      //@ts-expect-error a was not selected
      r[0].a,
  )
{
  repo
    .aggregate({
      sum: ['salary', 'numberOfKids'],
      avg: ['salary'],
      orderBy: {
        salary: {
          sum: 'asc',
          avg: 'asc',
        },
        numberOfKids: {
          sum: 'asc',
          //@ts-expect-error - was not selected
          avg: 'asc',
        },
      },
    })
    .then((r) => {
      r.salary.sum
      r.salary.avg
      r.numberOfKids.sum
      //@ts-expect-error - was not selected
      r.numberOfKids.average
    })
}

repo.aggregate({
  groupBy: ['salary'],
  sum: ['salary'],
})