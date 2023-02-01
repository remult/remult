import type { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult, NextApiRequest, NextApiResponse, PreviewData } from 'next'
import type { ParsedUrlQuery } from 'querystring';
import { createRemultServer, RemultServer, RemultServerOptions } from './server';



export function remultNext(
  options?:
    RemultServerOptions<NextApiRequest>,
): RemultServer & {
  getServerSideProps<
    P extends { [key: string]: any } = { [key: string]: any },
    Q extends ParsedUrlQuery = ParsedUrlQuery,
    D extends PreviewData = PreviewData
  >(
    getServerPropsFunction: GetServerSideProps<P, Q, D>
  ): GetServerSideProps<P, Q, D>
} {
  let result = createRemultServer(options);
  return Object.assign(result, {
    getServerSideProps: getServerPropsFunction => {
      return (context) => {

        return new Promise<GetServerSidePropsResult<any>>((res, err) => {
          result.withRemult(context, undefined!, async () => {
            try {
              let r = await getServerPropsFunction(context);
              res(JSON.parse(JSON.stringify(r)));
            } catch (e) {
              err(e);
            }
          });
        });
      }
    },
  })
}