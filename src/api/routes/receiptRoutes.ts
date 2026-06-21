import type { FastifyPluginAsync, preHandlerAsyncHookHandler } from "fastify";
import type { ReceiptController } from "../controllers/ReceiptController.js";

export function receiptRoutes(
  controller: ReceiptController,
  authenticate: preHandlerAsyncHookHandler,
): FastifyPluginAsync {
  return (app) => {
    app.post("/scan", { preHandler: authenticate }, controller.scan);
    return Promise.resolve();
  };
}
