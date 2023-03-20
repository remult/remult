import { HandlerContext } from "$fresh/server.ts"
export const handler = async (
  _req: Request,
  _ctx: HandlerContext
): Promise<Response> => {
  let ref: any;
		const stream = new ReadableStream({
			start: (controller) => {
				ref = setInterval(() => controller.enqueue('noam\n\n'), 1000);
			},
			cancel: () => {
				console.log('close connection');
				clearInterval(ref);
			}
		});
		return new Response(stream.pipeThrough(new TextEncoderStream()), {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive'
			}
		});

}
