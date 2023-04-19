import type {
  GetServerSideProps,
  GetServerSidePropsResult,
  NextApiRequest,
  PreviewData,
  NextApiHandler
} from "next"
import type { ParsedUrlQuery } from "querystring"
import { createRemultServer, RemultServer, RemultServerOptions } from "./server"

export function remultNext(
  options?: RemultServerOptions<NextApiRequest>
): RemultServer<NextApiRequest> &
  NextApiHandler & {
    getServerSideProps<
      P extends { [key: string]: any } = { [key: string]: any },
      Q extends ParsedUrlQuery = ParsedUrlQuery,
      D extends PreviewData = PreviewData
    >(
      getServerPropsFunction: GetServerSideProps<P, Q, D>
    ): GetServerSideProps<P, Q, D>
  } {
  let result = createRemultServer(options, {
    buildGenericRequest: req => req
  })
  return Object.assign(
    (req, res) => result.handle(req, res).then(() => { }),
    result, {
      getRemult: (...args) => result.getRemult(...args),
      handle: (...args) => result.handle(...args),
      openApiDoc: (...args) => result.openApiDoc(...args),
      registerRouter: (...args) => result.registerRouter(...args),
      withRemult: (...args) => result.withRemult(...args),
    } as RemultServer<NextApiRequest>,
    {
      getServerSideProps: (getServerPropsFunction) => {
        return (context) => {
          return new Promise<GetServerSidePropsResult<any>>((res, err) => {
            result.withRemult(context, undefined!, async () => {
              try {
                let r = await getServerPropsFunction(context)
                res(JSON.parse(JSON.stringify(r)))
              } catch (e) {
                err(e)
              }
            })
          })
        }
      }
    }
  )
}
