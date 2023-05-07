// import {
//   createRemultServer,
//   RemultServer,
//   GenericResponse,
//   RemultServerOptions,
// } from "remult/server";
// import { ResponseRequiredForSSE } from "remult/SseSubscriptionServer";



// // article for auth:
// // https://codevoweb.com/setup-and-use-nextauth-in-nextjs-13-app-directory/
// const encoder = new TextEncoder();

// export function remultNextApp(
//   options?: RemultServerOptions<Request>
// ): RemultServer<Request> & {
//   GET: (req: Request) => Promise<Response>;
//   PUT: (req: Request) => Promise<Response>;
//   POST: (req: Request) => Promise<Response>;
//   DELETE: (req: Request) => Promise<Response>;
//   withRemult<T>(what: () => Promise<T>): Promise<T>;
// } {
//   let result = createRemultServer<Request>(options!, {
//     getRequestBody: req => req.json(),
//     buildGenericRequestInfo: (req) => ({
//       url: req.url,
//       method: req.method,

//       on: (e: "close", do1: VoidFunction) => {
//         if (e === "close") {
//           (req as any)["_tempOnClose"] = do1;
//         }
//       },
//     }),
//   });
//   const handler = async (req: Request) => {
//     {
//       let sseResponse: Response | undefined = undefined;
//       (req as any)["_tempOnClose"] = () => { };

//       const response: GenericResponse & ResponseRequiredForSSE = {
//         end: () => { },
//         json: () => { },
//         status: () => {
//           return response;
//         },
//         write: () => { },
//         writeHead: (status, headers) => {
//           if (status === 200 && headers) {
//             const contentType = headers["Content-Type"];
//             if (contentType === "text/event-stream") {
//               const messages: string[] = [];
//               response.write = (x) => messages.push(x);
//               const stream = new ReadableStream({
//                 start: (controller) => {
//                   for (const message of messages) {
//                     controller.enqueue(encoder.encode(message));
//                   }
//                   response.write = (data) => {
//                     controller.enqueue(encoder.encode(data));
//                   };
//                 },
//                 cancel: () => {
//                   response.write = () => { };
//                   (req as any)["_tempOnClose"]();
//                 },
//               });
//               sseResponse = new Response(stream, { headers });
//             }
//           }
//         },
//       };


//       const responseFromRemultHandler = await result.handle(req, response);
//       if (sseResponse !== undefined) {
//         return sseResponse;
//       }
//       if (responseFromRemultHandler) {
//         return new Response(JSON.stringify(responseFromRemultHandler.data), {
//           status: responseFromRemultHandler.statusCode,
//         });
//       }
//     }
//   };
//   //@ts-ignore
//   return Object.assign({}, {
//     getRemult: (req) => result.getRemult(req),
//     openApiDoc: (options: { title: string }) => result.openApiDoc(options),
//     registerRouter: (x) => result.registerRouter(x),
    
//     handler: handler,
//     GET: handler,
//     POST: handler,
//     PUT: handler,
//     DELETE: handler,
//     withRemult: (what: ()=>Promise<any>) => {
//       return new Promise<any>((resolve) => {
//         return result.withRemult({} as any, undefined!, () => {
//           what().then(resolve)
//         })
//       })
//     }

//   } as RemultServer<Request>);
// }
