import { DataApi } from "./src/data-api";
import { RemultServerCore } from "./server/expressBridge";

export function remultGraphql(api: RemultServerCore<any>) {

  let server = api["get internal server"]();
  const entities = server.getEntities();
  let types: {
    key: string,
    fields: string,
    moreFields: string,
    resultProcessors: ((item: any) => void)[]
  }[] = [];
  let filterTypes = '';
  let query = '';
  let root = {};
  let resolversQuery = {}
  let resolvers = { Query: resolversQuery }

  function getType(key: string) {
    let t = types.find(t => t.key === key);
    if (!t)
      types.push((t = ({ fields: "", key, moreFields: "", resultProcessors: [] })))
    return t;
  }
  for (const meta of entities) {
    let filterFields = '';

    let key = meta.key;
    const t = getType(key)
    let q = "\n\t" + key + "(options: options, filter:" + key + "Filter): [" + getTypeName(key) + "]";
    if (key) {

      const filterFieldMap = new Map<string, string>()

      for (const f of meta.fields) {
        {
          let type = "String";
          switch (f.valueType) {
            case Boolean:
              type = "Boolean";
              break;
            case Number:
              {
                if (f.valueConverter?.fieldTypeInDb == 'integer')
                  type = "Int";
                else
                  type = "Float";
              }
              break;
          }
          let info = entities.find(i => i.entityType === f.valueType);
          if (info !== undefined) {
            const refKey = info.key;
            t.fields += "\n\t" + f.key + ":" + getTypeName(refKey);
            t.resultProcessors.push(r => {
              const val = r[f.key];
              if (val === null || val === undefined)
                return null;
              r[f.key] = async (args: any, req: any, gqlInfo: any) => {
                const queryResult: any[] = await root[refKey]({ ...args.filter, filter: { id: val }, options: { limit: 1 } }, req, gqlInfo);
                if (queryResult.length > 0)
                  return queryResult[0];
                return null;
              }
            });
            let refT = getType(refKey);
            refT.moreFields += q;
            refT.resultProcessors.push(r => {
              const val = r.id;
              r[key] = async (args: any, req: any, gqlInfo: any) => {
                return await root[key]({ filter: { ...args.filter, [f.key]: val }, options: args.options }, req, gqlInfo);
              }
            })
          }
          else
            t.fields += "\n\t" + f.key + ":" + type;
          const addFilter = (operator: string, theType?: string) => {
            if (!theType)
              theType = type;
            filterFields += "\n\t" + f.key + operator + ":" + theType;
            filterFieldMap.set(f.key + operator.replace('_', '.'), f.key + operator);
          }
          for (const operator of ["", "_ne"]) {
            addFilter(operator);

          }
          if (f.valueType === String || f.valueType === Number)
            for (const operator of ["_gt", "_gte", "_lt", "_lte"]) {
              addFilter(operator);
            }
          if (f.valueType === String)
            for (const operator of ["_st", "_contains"]) {
              addFilter(operator);
            }
          if (f.allowNull)
            addFilter("_null", "Boolean");
          addFilter("_in", "[" + type + "]");
        }
      }


      filterTypes += "input " + key + "Filter{" + filterFields + "\n\tOR:[" + key + "Filter]\n}\n";
      query += q;
      root[key] = async (arg1, req, a) => {
        const { options, filter } = arg1;
        return new Promise(async (res, error) => {

          server.run(req, async () => {
            let remult = await api.getRemult(req);
            let repo = remult.repo(meta.entityType);
            let dApi = new DataApi(repo, remult);
            let result: any;
            let err: any;
            await dApi.getArray({
              success: x => result = x.map(y => {
                t.resultProcessors.forEach(z => z(y));
                return y
              }),
              created: undefined,
              deleted: undefined,
              error: x => err = x,
              forbidden: () => err = 'forbidden',
              notFound: () => err = 'not found',
              progress: undefined


            }, {
              get: key => {
                if (options)
                  switch (key) {
                    case "_limit":
                      return options.limit;
                    case "_page":
                      return options.page;
                    case "_sort":
                      return options.sort;
                    case "_order":
                      return options.order;
                  }
                if (filter) {
                  let f = filterFieldMap.get(key);
                  if (f)
                    return filter[f];
                }
              }
            }, filter);
            if (err) {
              error(err);
              return
            }
            res(result);
          });
        });
      }
      resolversQuery[key] = (origItem: any, args: any, req: any, gqlInfo: any) => root[key](args, req, gqlInfo);
    }
  }
  if (query.length > 0) {
    query = `type Query {${query}
}`

  }






  return {
    resolvers,
    rootValue: root,
    schema:
      `${types.map(({ key, fields, moreFields }) => "type " + getTypeName(key) + "{" + fields + moreFields + "\n}\n").join('')}
${query}
${filterTypes}
input options{
    limit:Int
    page:Int
    sort:String
    order:String
}
`
  };
}

function getTypeName(key: string) {
  return key;
}

//TODO - filter doesn't work since we changed id_eq to be id.eq in rest, but graphql doesn't allow it.
//TODO - the list of entities, is based on entities - that's wrong - it should be based on the api entities - or a separate array.
//TODO - it's currently only planned for express server - it uses it's 'withRemult' that doesn't exist in all other servers.
//TODO - it doesn't support mutations
//TODO - it doesn't support backend methods