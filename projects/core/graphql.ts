import { Remult } from ".";

import { allEntities } from "./src/context";
import { getEntityKey } from "./src/remult3";

import { DataApi } from "./src/data-api";
import { RemultServer } from "./server/expressBridge";
import { ValueConverters } from "./src/valueConverters";

export function remultGraphql(api: RemultServer) {
  let r = new Remult();
  let types: {
    key: string,
    fields: string,
    moreFields: string,
    resultProcessors: ((item: any) => void)[]
  }[] = [];
  let filterTypes = '';
  let query = '';
  let root = {};
  function getType(key: string) {
    let t = types.find(t => t.key === key);
    if (!t)
      types.push((t = ({ fields: "", key, moreFields: "", resultProcessors: [] })))
    return t;
  }
  for (const e of allEntities) {
    let meta = r.repo(e).metadata;
    let filterFields = '';

    let key = meta.key;
    const t = getType(key)
    let q = "\n\t" + key + "(options: options, filter:" + key + "Filter): [" + key + "]";
    if (key) {
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
          if (allEntities.includes(f.valueType)) {
            const refKey = r.repo(f.valueType).metadata.key;
            t.fields += "\n\t" + f.key + ":" + refKey;
            t.resultProcessors.push(r => {
              const val = r[f.key];
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
          for (const operator of ["", "_ne"]) {
            filterFields += "\n\t" + f.key + operator + ":" + type;
          }
          if (f.valueType === String || f.valueType === Number)
            for (const operator of ["_gt", "_gte", "_lt", "_lte"]) {
              filterFields += "\n\t" + f.key + operator + ":" + type;
            }
          if (f.valueType === String)
            for (const operator of ["_st", "_contains"]) {
              filterFields += "\n\t" + f.key + operator + ":" + type;
            }
          if (f.allowNull)
            filterFields += "\n\t" + f.key + "_null:Boolean";
          filterFields += "\n\t" + f.key + "_in:[" + type + "]";
        }
      }


      filterTypes += "input " + key + "Filter{" + filterFields + "\n\tOR:[" + key + "Filter]\n}\n";
      query += q;
      root[key] = async ({ options, filter }, req, a) => {
        console.log({ ...a.fieldNodes })

        return new Promise(async (res, error) => {
          api.withRemult(req, undefined!, async () => {
            let remult = await api.getRemult(req);
            let repo = remult.repo(e);
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
    }
  }
  if (query.length > 0) {
    query = `type Query {${query}
}`

  }






  return {
    rootValue: root,
    schema:
      `${types.map(({ key, fields, moreFields }) => "type " + key + "{" + fields + moreFields + "\n}\n").join('')}
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