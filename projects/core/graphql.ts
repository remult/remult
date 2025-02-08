import { getRelationFieldInfo } from './internals.js'
import type { ClassType } from './classType.js'
import type {
  EntityMetadata,
  FieldMetadata,
  FieldsMetadata,
  Repository,
} from './index.js'
import { CompoundIdField, Remult, remult } from './index.js'
import type { DataApiResponse } from './src/data-api.js'
import { DataApi } from './src/data-api.js'
import { getRepositoryInternals } from './src/remult3/repository-internals.js'

const v2ConnectionAndPagination = false
const andImplementation = false

type Enum = { Enum: true }
type Union = { Union: true }

type Arg = {
  key: string
  value: Enum | Union | string
  comment?: string
}

type Field = Arg & {
  args?: Arg[]
  order?: number
}

type Kind =
  | 'type_impl_node'
  | 'type_impl_error'
  | 'type'
  | 'input'
  | 'enum'
  | 'interface'
  | 'union'

type GraphQLType = {
  kind: Kind
  key: string
  comment?: string
  fields: Field[]
  query: {
    orderBy: string[]
    whereType: string[]
    whereTypeSubFields: string[]
    resultProcessors: ((item: any, origItem: any) => void)[]
  }
  mutation: {
    create: {
      input?: GraphQLType
      payload?: GraphQLType
    }
    update: {
      input?: GraphQLType
      payload?: GraphQLType
    }
    delete: {
      payload?: GraphQLType
    }
  }
  order?: number
}

let _removeComments = false
export function remultGraphql(options: {
  removeComments?: boolean
  entities: ClassType<any>[]
  getRemultFromRequest?: (req: any) => Promise<Remult>
}) {
  if (!options.getRemultFromRequest) {
    options.getRemultFromRequest = async () => remult
  }
  const { removeComments } = {
    removeComments: false,
    ...options,
  }

  if (removeComments) {
    _removeComments = true
  }

  const entities = (() => {
    const remult = new Remult()
    return options.entities?.map((x) => remult.repo(x).metadata) || []
  })()

  const types: GraphQLType[] = []

  const root: Record<string, any> = {}
  const resolversQuery: Record<string, unknown> = {}
  const resolversMutation: Record<string, unknown> = {}
  const resolvers = { Query: resolversQuery, Mutation: resolversMutation }

  function upsertTypes(key: string, kind: Kind = 'type', order = 0) {
    let t = types.find((t) => t.key === key)
    if (!t) {
      types.push(
        (t = {
          key,
          kind,
          fields: [],
          query: {
            orderBy: [],
            whereType: [],
            whereTypeSubFields: [],
            resultProcessors: [],
          },
          mutation: {
            create: {},
            update: {},
            delete: {},
          },
          order,
        }),
      )
      if (kind === 'type_impl_node') {
        t.fields.push({ ...argNodeId, order: 111 })
      }
    }
    return t
  }

  function upsertUnion(key: string, values: string[], order?: number) {
    const u = upsertTypes(key, 'union', order)
    u.fields = values.map((value) => {
      return { key: value, value: { Union: true } }
    })
    return u
  }

  // Where - GraphQL primitives
  for (const whereType of ['String', 'Int', 'Float', 'Boolean', 'ID']) {
    const currentWhere = upsertTypes(`Where${whereType}`, 'input', 20)
    const currentWhereNullable = upsertTypes(
      `Where${whereType}Nullable`,
      'input',
      20,
    )

    // For everyone
    const operatorType = ['eq', 'ne']
    const operatorTypeArray = ['in', 'nin']
    for (const operator of [...operatorType, ...operatorTypeArray]) {
      const field = {
        key: operator,
        value: operatorTypeArray.includes(operator)
          ? `[${whereType}!]`
          : whereType,
      }
      currentWhere.fields.push(field)
      currentWhereNullable.fields.push(field)
    }

    // only for specific types
    if (
      whereType === 'String' ||
      whereType === 'Int' ||
      whereType === 'Float'
    ) {
      for (const operator of ['gt', 'gte', 'lt', 'lte']) {
        const field = {
          key: operator,
          value: whereType,
        }
        currentWhere.fields.push(field)
        currentWhereNullable.fields.push(field)
      }
    }

    if (whereType === 'String') {
      for (const operator of ['contains', 'notContains']) {
        const field = {
          key: operator,
          value: whereType,
        }
        currentWhere.fields.push(field)
        currentWhereNullable.fields.push(field)
      }
    }

    // add only for nullable
    currentWhereNullable.fields.push({
      key: 'null',
      value: 'Boolean',
    })
  }

  const root_query = upsertTypes('Query', 'type', -10)
  root_query.comment = `Represents all Remult entities.`
  const argId: Arg = { key: `id`, value: `ID!` }

  const nodeIdKey = 'nodeId'
  const argNodeId: Arg = {
    key: nodeIdKey,
    value: `ID!`,
    comment: `The globally unique \`ID\` _(_typename:id)_`,
  }
  const argClientMutationId = { key: 'clientMutationId', value: `String` }
  const argErrorDetail = { key: 'error', value: `ErrorDetail` }

  for (const meta of entities) {
    const orderByFields: string[] = []

    const key = meta.key
    const requiredWhereArg: Arg = {
      key: 'where',
      value: `${key}Where!`,
      comment: `Remult filtering options`,
    }
    const currentType = upsertTypes(getMetaType(meta), 'type_impl_node')

    if (key) {
      const createResultPromise = (
        work: (
          response: DataApiResponse,
          setResult: (result: any) => void,
          arg1: any,
          req: any,
        ) => Promise<void>,
      ) => {
        return async (arg1: any, req: any) => {
          return new Promise((res, error) => {
            let result: any
            let err: any
            const response = {
              success: (x: any) => {
                err = 'success not handled'
              },
              created: () => {
                err = 'created not handled'
              },
              deleted: () => {
                err = 'deleted not handled'
              },
              error: (x: any) => (err = x),
              forbidden: () => (err = 'forbidden'),
              notFound: () => (err = 'not found'),
              progress: () => {},
            }
            work(response, (x) => (result = x), arg1, req)
              .then(() => {
                if (err) {
                  error(err)
                  return
                }
                res(result)
              })
              .catch((err) => error(err))
          })
        }
      }

      const handleRequestWithDataApiContextBasedOnRepo = (
        repo: Repository<any>,
        work: (
          dataApi: DataApi,
          response: DataApiResponse,
          setResult: (result: any) => void,
          arg1: any,
          meta: EntityMetadata,
        ) => Promise<void>,
      ) => {
        return createResultPromise(async (response, setResult, arg1, req) => {
          const dApi = new DataApi(repo, remult)
          await work(dApi, response, setResult, arg1, repo.metadata)
        })
      }

      const handleRequestWithDataApiContext = (
        work: (
          dataApi: DataApi,
          response: DataApiResponse,
          setResult: (result: any) => void,
          arg1: any,
          meta: EntityMetadata,
        ) => Promise<void>,
      ) => {
        return createResultPromise(async (response, setResult, arg1, req) => {
          const remult = await options.getRemultFromRequest!(req)
          const repo = remult.repo(meta.entityType)
          const dApi = new DataApi(repo, remult)
          await work(dApi, response, setResult, arg1, meta)
        })
      }
      const handleMutationWithErrors = (
        work: (
          dataApi: DataApi,
          response: DataApiResponse,
          setResult: (result: any) => void,
          arg1: any,
          meta: EntityMetadata,
        ) => Promise<void>,
      ) => {
        return handleRequestWithDataApiContext(
          async (dApi, response, origSetResult, arg1: any, req: any) => {
            const setResult = (item: any) => {
              origSetResult({
                clientMutationId: arg1.clientMutationId,
                ...item,
              })
            }
            return work(
              dApi,
              {
                ...response,
                forbidden: () => {
                  setResult({
                    error: {
                      __typename: 'ForbiddenError',
                      message: 'forbidden',
                    },
                  })
                },
                notFound: () => {
                  setResult({
                    error: {
                      __typename: 'NotFoundError',
                      message: 'not found',
                    },
                  })
                },
                error: (err) => {
                  const modelState: any[] = []
                  if (err.modelState)
                    for (const key in err.modelState) {
                      modelState.push({
                        field: key,
                        message:
                          err.modelState[
                            key as keyof (typeof err)['modelState']
                          ],
                      })
                    }
                  setResult({
                    error: {
                      __typename: 'ValidationError',
                      message: err.message,
                      modelState,
                    },
                  })
                },
              },
              setResult,
              arg1,
              req,
            )
          },
        )
      }

      const queryArgsConnection: Arg[] = getQueryArgsConnection(key)
      let pluralEntityKey = key
      let getSingleEntityKey = toCamelCase(getMetaType(meta))
      if (getSingleEntityKey === toCamelCase(key))
        getSingleEntityKey = 'single' + key
      root_query.fields.push({
        key: getSingleEntityKey,
        args: [argId],
        value: `${getMetaType(meta)}`,
        comment: `Get \`${getMetaType(meta)}\` entity`,
      })

      root[getSingleEntityKey] = handleRequestWithDataApiContext(
        async (dApi, response, setResult, arg1: any, req: any) => {
          await dApi.get(
            {
              ...response,
              success: (y) => {
                const orig = { ...y }
                currentType.query.resultProcessors.forEach((z) => z(y, orig))
                setResult(y)
              },
            },
            arg1.id,
          )
        },
      )
      resolversQuery[getSingleEntityKey] = (
        origItem: any,
        args: any,
        req: any,
        gqlInfo: any,
      ) => root[getSingleEntityKey](args, req, gqlInfo)

      // Connection (v1 items, v2 edges)
      const connectionKey = `${getMetaType(meta)}Connection`
      root_query.fields.push({
        key,
        args: queryArgsConnection,
        value: connectionKey,
        comment: `List all \`${getMetaType(
          meta,
        )}\` entity (with pagination, sorting and filtering)`,
      })

      const connection = upsertTypes(connectionKey, 'type')
      const totalCountKey = 'totalCount'
      connection.fields.push({
        key: totalCountKey,
        value: 'Int!',
      })

      if (v2ConnectionAndPagination) {
        connection.fields.push({
          key: 'edges',
          value: `[${getMetaType(meta)}Edge!]!`,
        })
      }
      const itemsKey = 'items'
      connection.fields.push({
        key: itemsKey,
        value: `[${getMetaType(meta)}!]!`,
      })
      if (v2ConnectionAndPagination) {
        connection.fields.push({
          key: 'pageInfo',
          value: `PageInfo!`,
        })
      }

      if (v2ConnectionAndPagination) {
        const edge = upsertTypes(`${getMetaType(meta)}Edge`, 'type')
        edge.fields.push({
          key: 'node',
          value: `${getMetaType(meta)}!`,
        })
        const cursorKey = 'cursor'
        edge.fields.push({
          key: cursorKey,
          value: `String!`,
        })
      }

      root[key] = handleRequestWithDataApiContext(
        async (dApi, response, setResult, arg1: any, meta: EntityMetadata) => {
          connectionImplementation(
            setResult,
            itemsKey,
            createResultPromise,
            dApi,
            currentType,
            arg1,
            meta,
            totalCountKey,
          )
        },
      )

      resolversQuery[key] = (
        origItem: any,
        args: any,
        req: any,
        gqlInfo: any,
      ) => {
        return root[key](args, req, gqlInfo)
      }

      // Mutation
      const root_mutation = upsertTypes('Mutation', 'type', -9)

      const checkCanExist = (rule: any) =>
        rule !== false &&
        !(
          rule === undefined &&
          (meta.options.allowApiCrud === false ||
            meta.options.allowApiCrud === undefined)
        )

      if (checkCanExist(meta.options.allowApiInsert)) {
        // create
        const createResolverKey = `create${getMetaType(meta)}`
        const createInput = `Create${getMetaType(meta)}Input`
        const createPayload = `Create${getMetaType(meta)}Payload`

        root_mutation.fields.push({
          key: createResolverKey,
          args: [
            { key: 'input', value: `${createInput}!` },
            argClientMutationId,
          ],
          value: `${createPayload}`,
          comment: `Create a new \`${getMetaType(meta)}\``,
        })

        currentType.mutation.create.input = upsertTypes(createInput, 'input')

        currentType.mutation.create.payload = upsertTypes(createPayload)
        currentType.mutation.create.payload.fields.push(
          {
            key: `${toCamelCase(getMetaType(meta))}`,
            value: getMetaType(meta),
          },
          argErrorDetail,
          argClientMutationId,
        )

        root[createResolverKey] = handleMutationWithErrors(
          async (dApi, response, setResult, arg1: any, req: any) => {
            await dApi.httpPost(
              {
                ...response,
                created: (y) => {
                  const orig = { ...y }
                  currentType.query.resultProcessors.forEach((z) => z(y, orig))
                  setResult({
                    [toCamelCase(getMetaType(meta))]: y,
                  })
                },
              },
              { get: () => undefined! },
              arg1.input,
              undefined!,
            )
          },
        )
        resolversMutation[createResolverKey] = (
          origItem: any,
          args: any,
          req: any,
          gqlInfo: any,
        ) => root[createResolverKey](args, req, gqlInfo)
      }

      if (checkCanExist(meta.options.allowApiUpdate)) {
        // update
        const updateInput = `Update${getMetaType(meta)}Input`
        {
          const updatePayload = `Update${getMetaType(meta)}Payload`
          const updateResolverKey = `update${getMetaType(meta)}`
          root_mutation.fields.push({
            key: updateResolverKey,
            args: [
              argId,
              { key: 'patch', value: `${updateInput}!` },
              argClientMutationId,
            ],
            value: `${updatePayload}`,
            comment: `Update a \`${getMetaType(meta)}\``,
          })

          currentType.mutation.update.input = upsertTypes(updateInput, 'input')

          currentType.mutation.update.payload = upsertTypes(updatePayload)
          currentType.mutation.update.payload.fields.push(
            {
              key: `${toCamelCase(getMetaType(meta))}`,
              value: `${getMetaType(meta)}`,
            },
            argErrorDetail,
            argClientMutationId,
          )
          resolversMutation[updateResolverKey] = (
            origItem: any,
            args: any,
            req: any,
            gqlInfo: any,
          ) =>
            handleMutationWithErrors(
              async (dApi, response, setResult, arg1: any, req: any) => {
                await dApi.put(
                  {
                    ...response,
                    success: (y) => {
                      const orig = { ...y }
                      currentType.query.resultProcessors.forEach((z) =>
                        z(y, orig),
                      )
                      setResult({
                        [toCamelCase(getMetaType(meta))]: y,
                      })
                    },
                  },
                  arg1.id,
                  arg1.patch,
                )
              },
            )(args, req)
        }
        // update many
        {
          const updateManyPayload = `UpdateMany${upperFirstChar(
            pluralEntityKey,
          )}Payload`
          const updateManyResolverKey = `updateMany${upperFirstChar(
            pluralEntityKey,
          )}`
          root_mutation.fields.push({
            key: updateManyResolverKey,
            args: [
              requiredWhereArg,
              { key: 'patch', value: `${updateInput}!` },
              argClientMutationId,
            ],
            value: `${updateManyPayload}`,
            comment: `Update many \`${pluralEntityKey}\``,
          })

          currentType.mutation.update.payload = upsertTypes(updateManyPayload)
          currentType.mutation.update.payload.fields.push(
            {
              key: `updated`,
              value: `Int!`,
            },
            argErrorDetail,
            argClientMutationId,
          )
          resolversMutation[updateManyResolverKey] = (
            origItem: any,
            args: any,
            req: any,
            gqlInfo: any,
          ) =>
            handleMutationWithErrors(
              async (dApi, response, setResult, arg1: any, req: any) => {
                await dApi.updateManyImplementation(
                  {
                    ...response,
                    success: (updateManyResult) => {
                      setResult(updateManyResult)
                    },
                  },
                  { get: () => undefined },
                  {
                    ...translateWhereToRestBody(meta.fields, arg1),
                    set: arg1.patch,
                  },
                )
              },
            )(args, req)
        }
      }

      if (checkCanExist(meta.options.allowApiDelete)) {
        // delete
        {
          const deletePayload = `Delete${getMetaType(meta)}Payload`
          const deleteResolverKey = `delete${getMetaType(meta)}`
          root_mutation.fields.push({
            key: deleteResolverKey,
            args: [argId, argClientMutationId],
            value: `${deletePayload}`,
            comment: `Delete a \`${getMetaType(meta)}\``,
          })

          currentType.mutation.delete.payload = upsertTypes(deletePayload)
          const deletedResultKey = `id`
          const type =
            meta.idMetadata.field instanceof CompoundIdField
              ? 'String'
              : getGraphqlBaseType(meta.idMetadata.field)
          currentType.mutation.delete.payload.fields.push(
            {
              key: deletedResultKey,
              value: `${type}`,
            },
            argErrorDetail,
            argClientMutationId,
          )
          resolversMutation[deleteResolverKey] = (
            origItem: any,
            args: any,
            req: any,
          ) =>
            handleMutationWithErrors(
              async (dApi, response, setResult, arg1: any, req: any) => {
                await dApi.delete(
                  {
                    ...response,
                    deleted: () => {
                      setResult({ [deletedResultKey]: arg1.id })
                    },
                  },
                  arg1.id,
                )
              },
            )(args, req)
        }
        // delete
        {
          const deleteManyPayload = `DeleteMany${upperFirstChar(
            pluralEntityKey,
          )}Payload`
          const deleteManyResolverKey = `deleteMany${upperFirstChar(
            pluralEntityKey,
          )}`
          root_mutation.fields.push({
            key: deleteManyResolverKey,
            args: [requiredWhereArg, argClientMutationId],
            value: `${deleteManyPayload}`,
            comment: `Delete many \`${pluralEntityKey}\``,
          })

          currentType.mutation.delete.payload = upsertTypes(deleteManyPayload)

          const type =
            meta.idMetadata.field instanceof CompoundIdField
              ? 'String'
              : getGraphqlBaseType(meta.idMetadata.field)
          currentType.mutation.delete.payload.fields.push(
            {
              key: 'deleted',
              value: `Int!`,
            },
            argErrorDetail,
            argClientMutationId,
          )
          resolversMutation[deleteManyResolverKey] = (
            origItem: any,
            args: any,
            req: any,
          ) =>
            handleMutationWithErrors(
              async (dApi, response, setResult, arg1: any, req: any) => {
                await dApi.deleteMany(
                  {
                    ...response,
                    success: (deleteManyResult) => {
                      setResult(deleteManyResult)
                    },
                  },
                  { get: () => undefined },
                  translateWhereToRestBody(meta.fields, arg1),
                )
              },
            )(args, req)
        }
      }
      const whereTypeFields: string[] = []
      for (const f of meta.fields) {
        const ri = getRelationFieldInfo(f)

        if (f.options.includeInApi === false) continue
        const type = getGraphqlBaseType(f)
        currentType.query.resultProcessors.push((r) => {
          r[nodeIdKey] = () =>
            getMetaType(meta) + ':' + meta.idMetadata.getId(r)
        })
        let ref = entities.find((i: any) => i.entityType === f.valueType)!
        let notARealField = false
        if (ri) {
          {
            const refType = ri.toEntity
            ref = entities.find((i: any) => i.entityType === refType)!
          }
          if (!ref) {
            throw new Error(
              `Entity "${ri.toEntity.name}" that is used by the relation "${f.key}" in "${meta.entityType.name}" was not found in the 'entities' array.`,
            )
          }
          notARealField = ri.type === 'toOne' || ri.type === 'toMany'
          const refKey = ref.key
          switch (ri.type) {
            case 'reference':
            case 'toOne':
              currentType.fields.push({
                key: f.key,
                value: `${getMetaType(ref)}${f.allowNull ? '' : '!'}`,
                comment: f.caption,
              })
              currentType.query.resultProcessors.push((r, orig) => {
                r[f.key] = async (args: any, req: any, gqlInfo: any) => {
                  const remult = await options.getRemultFromRequest!(req)
                  const myRepo = remult.repo(meta.entityType)
                  const item = myRepo.fromJson(orig)
                  let { toRepo, returnNull, returnUndefined } =
                    getRepositoryInternals(myRepo)._getFocusedRelationRepo(
                      myRepo.fields.find(f),
                      item,
                    )
                  if (returnNull || returnUndefined) return null
                  const result: any =
                    await handleRequestWithDataApiContextBasedOnRepo(
                      toRepo,
                      async (
                        dApi,
                        response,
                        setResult,
                        arg1: any,
                        meta: EntityMetadata,
                      ) => {
                        return await connectionImplementation(
                          setResult,
                          itemsKey,
                          createResultPromise,
                          dApi,
                          upsertTypes(getMetaType(ref)),
                          arg1,
                          meta,
                          totalCountKey,
                        )
                      },
                    )({ ...args, options: { limit: 1 } }, req)
                  const resultItems = await result.items()
                  return resultItems[0]
                }
              })
              break
            case 'toMany':
              // will do: Category.tasks (actually: Category.tasksOfcategory & tasksOfcategory2)

              currentType.fields.push({
                key: f.key,
                args: getQueryArgsConnection(refKey),
                value: `${getMetaType(ref)}Connection`,
                order: 10,
                comment: `List all \`${getMetaType(meta)}\` of \`${refKey}\``,
              })

              currentType.query.resultProcessors.push((r, y) => {
                r[f.key] = async (args: any, req: any, gqlInfo: any) => {
                  const remult = await options.getRemultFromRequest!(req)
                  const myRepo = remult.repo(meta.entityType)
                  const item = myRepo.fromJson(y)
                  let relRepo = myRepo.relations(item)[f.key] as Repository<any>
                  return handleRequestWithDataApiContextBasedOnRepo(
                    relRepo,
                    async (
                      dApi,
                      response,
                      setResult,
                      arg1: any,
                      meta: EntityMetadata,
                    ) => {
                      return await connectionImplementation(
                        setResult,
                        itemsKey,
                        createResultPromise,
                        dApi,
                        upsertTypes(getMetaType(ref)),
                        arg1,
                        meta,
                        totalCountKey,
                      )
                    },
                  )(args, req)
                }
              })
          }
        } else if (ref !== undefined) {
          // will do: Task.category
          currentType.fields.push({
            key: f.key,
            value: `${getMetaType(ref)}${f.allowNull ? '' : '!'}`,
            comment: f.caption,
          })
          const refKey = ref.key
          currentType.query.resultProcessors.push((r) => {
            const val = r[f.key]
            if (val === null || val === undefined) return null
            r[f.key] = async (args: any, req: any, gqlInfo: any) => {
              const queryResult: any[] = await (
                await root[refKey](
                  {
                    ...args.where,
                    where: { id: { eq: val } },
                    options: { limit: 1 },
                  },
                  req,
                  gqlInfo,
                )
              ).items()
              if (queryResult.length > 0) return queryResult[0]
              return null
            }
          })

          // will do: Category.tasks (actually: Category.tasksOfcategory & tasksOfcategory2)
          const refT = upsertTypes(getMetaType(ref), 'type_impl_node')
          const keyOf = key + 'Of' + f.key
          refT.fields.push({
            key: keyOf,
            args: queryArgsConnection,
            value: connectionKey,
            order: 10,
            comment: `List all \`${getMetaType(meta)}\` of \`${refKey}\``,
          })

          refT.query.resultProcessors.push((r) => {
            const val = r.id
            r[keyOf] = async (args: any, req: any, gqlInfo: any) => {
              return await root[key](
                {
                  where: { ...args.where, [f.key]: { eq: val } },
                  options: { ...args.limit, ...args.page, ...args.orderBy },
                },
                req,
                gqlInfo,
              )
            }
          })
        } else {
          currentType.fields.push({
            key: f.key,
            value: `${type}${f.allowNull ? '' : '!'}`,
            comment: f.caption,
          })
        }

        // sorting
        if (!f.isServerExpression)
          orderByFields.push(`${f.key}: OrderByDirection`)

        // helper
        const it_is_not_at_ref = ref === undefined

        // where
        if (it_is_not_at_ref && !f.isServerExpression && !notARealField) {
          whereTypeFields.push(
            `${f.key}: Where${type}${f.allowNull ? 'Nullable' : ''}`,
          )
        }

        const includeInUpdateOrInsert =
          f.options.allowApiUpdate !== false && !notARealField
        const updateType = it_is_not_at_ref ? type : 'ID'
        if (includeInUpdateOrInsert) {
          // create
          if (currentType.mutation.create.input)
            currentType.mutation.create.input.fields.push({
              key: f.key,
              value: updateType,
            })

          // update
          if (currentType.mutation.update.input)
            currentType.mutation.update.input.fields.push({
              key: f.key,
              value: updateType,
            })
        }
      }

      currentType.query.orderBy.push(
        blockFormat({
          prefix: `input ${key}OrderBy`,
          data: orderByFields,
          comment: `OrderBy options for \`${key}\``,
        }),
      )

      whereTypeFields.push(`OR: [${key}Where!]`)
      if (andImplementation) whereTypeFields.push(`AND: [${key}Where!]`)
      currentType.query.whereType.push(
        blockFormat({
          prefix: `input ${key}Where`,
          data: whereTypeFields,
          comment: `Where options for \`${key}\``,
        }),
      )
    }
  }

  // Add the node interface at the end
  const nodeKey = 'node'
  root_query.fields.push({
    key: nodeKey,
    args: [argNodeId],
    value: `Node`,
    comment: `Grab any Remult entity given it's globally unique \`ID\``,
  })
  if (v2ConnectionAndPagination) {
    const pageInfo = upsertTypes('PageInfo', 'type', 30)
    pageInfo.fields.push({ key: 'endCursor', value: 'String!' })
    pageInfo.fields.push({ key: 'hasNextPage', value: 'Boolean!' })
    pageInfo.fields.push({ key: 'hasPreviousPage', value: 'Boolean!' })
    pageInfo.fields.push({ key: 'startCursor', value: 'String!' })
  }
  resolversQuery[nodeKey] = (
    origItem: any,
    args: any,
    req: any,
    gqlInfo: any,
  ) => root[nodeKey](args, req, gqlInfo)
  root[nodeKey] = async (args: any, req: any, gqlInfo: any) => {
    const nodeId = args.nodeId
    const sp = nodeId.split(':')
    const r: any = await root[toCamelCase(sp[0])](
      {
        id: sp[1],
      },
      req,
      gqlInfo,
    )
    r.__typename = sp[0]
    return r
  }

  const orderByDirection = upsertTypes('OrderByDirection', 'enum', 30)
  orderByDirection.comment = `Determines the order of returned elements`
  orderByDirection.fields.push({
    key: 'ASC',
    value: { Enum: true },
    comment: 'Sort data in ascending order',
  })
  orderByDirection.fields.push({
    key: 'DESC',
    value: { Enum: true },
    comment: 'Sort data in descending order',
  })

  const nodeInterface = upsertTypes('Node', 'interface', 31)
  nodeInterface.comment = `Node interface of remult entities (eg: nodeId: \`Task:1\` so \`__typename:id\`)`
  nodeInterface.fields.push(argNodeId)

  upsertUnion(
    argErrorDetail.value,
    ['ValidationError', 'ForbiddenError', 'NotFoundError'],
    32,
  )

  const errorInterface = upsertTypes('Error', 'interface', 33)
  errorInterface.comment = `Error interface of remult entities`
  errorInterface.fields.push({
    key: 'message',
    value: 'String!',
  })

  const validationErrorInterface = upsertTypes(
    'ValidationError',
    'type_impl_error',
    34,
  )
  validationErrorInterface.comment = `Validation Error`
  validationErrorInterface.fields.push({
    key: 'message',
    value: 'String!',
  })
  validationErrorInterface.fields.push({
    key: 'modelState',
    value: '[ValidationErrorModelState!]!',
  })

  const validationErrorModelStateInterface = upsertTypes(
    'ValidationErrorModelState',
    'type',
    34,
  )
  validationErrorModelStateInterface.comment = `Validation Error Model State`
  validationErrorModelStateInterface.fields.push({
    key: 'field',
    value: 'String!',
  })
  validationErrorModelStateInterface.fields.push({
    key: 'message',
    value: 'String!',
  })

  // progress: () => { },
  const forbiddenErrorInterface = upsertTypes(
    'ForbiddenError',
    'type_impl_error',
    34,
  )
  forbiddenErrorInterface.comment = `Forbidden Error`
  forbiddenErrorInterface.fields.push({
    key: 'message',
    value: 'String!',
  })

  const notFoundErrorInterface = upsertTypes(
    'NotFoundError',
    'type_impl_error',
    34,
  )
  notFoundErrorInterface.comment = `Not Found Error`
  notFoundErrorInterface.fields.push({
    key: 'message',
    value: 'String!',
  })

  return {
    resolvers,
    rootValue: root,
    typeDefs: `${types
      .sort((a, b) => (a.order ? a.order : 0) - (b.order ? b.order : 0))
      .map(({ key, kind, fields, query, comment }) => {
        const { orderBy, whereType, whereTypeSubFields } = query

        let prefix = `${kind} ${key}`
        if (kind === 'type_impl_node') {
          prefix = `type ${key} implements Node`
        }
        if (kind === 'type_impl_error') {
          prefix = `type ${key} implements Error`
        }

        const type =
          kind === 'union'
            ? `union ${key} = ${fields.map((field) => field.key).join(' | ')}`
            : blockFormat({
                prefix,
                data: fields
                  .sort(
                    (a, b) => (a.order ? a.order : 0) - (b.order ? b.order : 0),
                  )
                  .map((field) => fieldFormat(field)),
                comment: comment ?? `The ${kind} for \`${key}\``,
              })

        const orderByStr =
          orderBy.length > 0 ? `\n\n${orderBy.join('\n\n')}` : ``
        const whereTypeStr =
          whereType.length > 0 ? `\n\n${whereType.join('\n\n')}` : ``
        const whereTypeSubFieldsStr =
          whereTypeSubFields.length > 0
            ? `\n\n${whereTypeSubFields.join('\n\n')}`
            : ``
        return `${type}${orderByStr}${whereTypeStr}${whereTypeSubFieldsStr}`
      })
      .join(`\n\n`)}
`,
  }

  function connectionImplementation(
    setResult: (result: any) => void,
    itemsKey: string,
    createResultPromise: (
      work: (
        response: DataApiResponse,
        setResult: (result: any) => void,
        arg1: any,
        req: any,
      ) => Promise<void>,
    ) => (arg1: any, req: any) => Promise<unknown>,
    dApi: DataApi<any>,
    currentType: GraphQLType,
    arg1: any,
    meta: EntityMetadata,
    totalCountKey: string,
  ) {
    setResult({
      [itemsKey]: createResultPromise(async (response, setResult) => {
        await dApi.getArray(
          {
            ...response,
            success: (x: any) => {
              setResult(
                x.map((y: any) => {
                  const orig = { ...y }
                  currentType.query.resultProcessors.forEach((z) => z(y, orig))
                  return y
                }),
              )
            },
          },
          {
            get: bridgeQueryOptionsToDataApiGet(arg1),
          },
          translateWhereToRestBody(meta.fields, arg1),
        )
      }),
      [totalCountKey]: createResultPromise(async (response, setResult) => {
        await dApi.count(
          {
            ...response,
            success: (x) => setResult(x.count),
          },
          {
            get: bridgeQueryOptionsToDataApiGet(arg1),
          },
          translateWhereToRestBody(meta.fields, arg1),
        )
      }),
    })
  }
}

function getQueryArgsConnection(key: string) {
  const queryArgsConnection: Arg[] = [
    {
      key: 'limit',
      value: 'Int',
      comment: `
For **page by page** pagination.
Limit the number of result. 
_Side note: \`Math.ceil(totalCount / limit)\` to determine how many pages there are._`,
    },
    {
      key: 'page',
      value: 'Int',
      comment: `
For **page by page** pagination.
Select a dedicated page.`,
    },
    {
      key: 'offset',
      value: 'Int',
      comment: `
For **page by page** pagination.
Set the offset needed.
_Side node: if \`page\` arg is set, \`offset\` will be ignored._`,
    },
    {
      key: 'orderBy',
      value: `${key}OrderBy`,
      comment: `Remult sorting options`,
    },
    {
      key: 'where',
      value: `${key}Where`,
      comment: `Remult filtering options`,
    },
  ]
  if (v2ConnectionAndPagination) {
    queryArgsConnection.push(
      {
        key: 'first',
        value: 'Int',
        comment: `
        For **forward cursor** pagination
        Takes the \`first\`: \`n\` elements from the list.`,
      },
      {
        key: 'after',
        value: 'String',
        comment: `
        For **forward cursor** pagination
        \`after\` this \`cursor\`.`,
      },
      {
        key: 'last',
        value: 'Int',
        comment: `
        For **backward cursor** pagination
        Takes the \`last\`: \`n\` elements from the list.`,
      },
      {
        key: 'before',
        value: 'String',
        comment: `
        For **backward cursor** pagination
        \`before\` this \`cursor\`.`,
      },
    )
  }
  return queryArgsConnection
}

// For cursor pagination (v2)
// function checkPaginationArgs(args: any) {
//   let paginationPage = !!args.limit ? 1 : 0
//   paginationPage += !!args.page ? 1 : 0

//   let paginationCursor = !!args.first ? 1 : 0
//   paginationCursor += !!args.after ? 1 : 0
//   paginationCursor += !!args.last ? 1 : 0
//   paginationCursor += !!args.before ? 1 : 0

//   if (paginationPage > 0 && paginationCursor > 0) {
//     throw new GraphQLError(
//       `You can't use \`limit,page\` and \`first,after,last,before\` at the same time. Choose your pagination style.`,
//     )
//   }
// }

function blockFormat(obj: { prefix: string; data: string[]; comment: string }) {
  if (obj.data.length === 0) {
    return ``
  }

  const str = `${obj.prefix} {
  ${obj.data.join('\n  ')}
}`

  let commentsStr = `"""
${obj.comment}
"""
`

  if (_removeComments) {
    commentsStr = ``
  }

  return `${commentsStr}${str}`
}

function argsFormat(args?: Arg[]) {
  if (args) {
    return `(${args
      .map((arg) => {
        let strComment = `
    """
    ${arg.comment}
    """
`
        if (_removeComments || !arg.comment) {
          strComment = ``
        }

        if (strComment) {
          return `${strComment}    ${arg.key}: ${arg.value}
  `
        }

        return `${arg.key}: ${arg.value}`
      })
      .join(', ')})`
  }
  return ``
}

function fieldFormat(field: Field) {
  // First, the comment
  let strComment = `"""
  ${field.comment}
  """
`
  if (_removeComments || !field.comment) {
    strComment = ``
  }

  let key_value = `${field.key}${
    field.args ? `${argsFormat(field.args)}` : ``
  }: ${field.value}`
  // It's an enum
  if (typeof field.value === 'object') {
    key_value = `${field.key}`
  }

  return `${strComment}  ${key_value}`
}

function getGraphqlBaseType(field: FieldMetadata) {
  let type = 'String'
  switch (field.valueType) {
    case Boolean:
      type = 'Boolean'
      break
    case Number:
      {
        if (
          field.valueConverter?.fieldTypeInDb === 'integer' ||
          field.valueConverter?.fieldTypeInDb === 'autoincrement'
        )
          type = 'Int'
        else type = 'Float'
      }
      break
  }
  return type
}

function getMetaType(entityMeta: EntityMetadata) {
  return entityMeta.entityType.name
}
function upperFirstChar(str: string) {
  return str
    .split('')
    .map((c, i) => (i === 0 ? c.toUpperCase() : c))
    .join('')
}

function toCamelCase(str: string) {
  return str
    .split('')
    .map((c, i) => (i === 0 ? c.toLowerCase() : c))
    .join('')
}

function bridgeQueryOptionsToDataApiGet(arg1: any) {
  let { limit, page, orderBy, where, offset } = arg1
  if (!page && offset) {
    page = Math.floor(offset / limit) + 1
  }
  return (key: string) => {
    if (limit && key === '_limit') {
      return limit
    }
    if (page && key === '_page') {
      return page
    }
    if (orderBy) {
      if (key === '_sort') {
        const sort_keys: string[] = []
        Object.keys(orderBy).forEach((sort_key) => {
          sort_keys.push(sort_key)
        })
        if (sort_keys.length > 0) {
          return sort_keys.join(',')
        }
      } else if (key === '_order') {
        const sort_directions: string[] = []
        Object.keys(orderBy).forEach((sort_key) => {
          const direction = orderBy[sort_key].toLowerCase()
          sort_directions.push(direction)
        })
        if (sort_directions.length > 0) {
          return sort_directions.join(',')
        }
      }
    }
  }
}
//@internal
export function translateWhereToRestBody<T>(
  fields: FieldsMetadata<T>,
  { where }: { where: any },
) {
  if (!where) return undefined
  const result: any = {}
  for (const field of fields) {
    if (field.options.includeInApi === false) continue
    const condition: any = where[field.key]
    if (condition) {
      const tr = (key: string, what: (val: any) => void) => {
        const val = condition[key]
        if (val != undefined) what(val)
      }

      for (const op of ['gt', 'gte', 'lt', 'lte', 'ne', 'in']) {
        tr(op, (val) => (result[field.key + '.' + op] = val))
      }
      tr('nin', (x) => (result[field.key + '.ne'] = x))
      tr('eq', (x) => (result[field.key] = x))
      tr('contains', (x) => (result[field.key + '.contains'] = x))
      tr('notContains', (x) => (result[field.key + '.notContains'] = x))
    }
  }
  if (where.OR) {
    result.OR = where.OR.map(
      (where: any) => translateWhereToRestBody(fields, { where })?.where,
    )
  }
  return { where: result }
}
