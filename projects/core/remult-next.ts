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
): RemultServer &
  NextApiHandler & {
    getServerSideProps<
      P extends { [key: string]: any } = { [key: string]: any },
      Q extends ParsedUrlQuery = ParsedUrlQuery,
      D extends PreviewData = PreviewData
    >(
      getServerPropsFunction: GetServerSideProps<P, Q, D>
    ): GetServerSideProps<P, Q, D>
  } {
  let result = createRemultServer(options)
  return Object.assign(
    (req, res) => result.handle(req, res),
    result,
    {
      getServerSideProps: (getServerPropsFunction) => {
        return (context) => {
          return new Promise<GetServerSidePropsResult<any>>((res, err) => {
            result.withRemult(context.req, context.res, async () => {
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
